#!/usr/bin/env node
/**
 * Normalizacja inline list w questions.text i questions.explanation
 *
 *   node scripts/normalize-question-list-format.mjs --dry-run
 *   node scripts/normalize-question-list-format.mjs --apply
 *
 * Wymaga: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (np. z .env.local)
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// —— logika zsynchronizowana z lib/content/normalizeQuestionListText.ts ——

const PAREN_ENUM = /\([\da-zA-Z]+[-–][\da-zA-Z]*$/;

function isParenRangeBefore(text, index) {
  const slice = text.slice(Math.max(0, index - 12), index);
  return PAREN_ENUM.test(slice);
}

function insertBreaksBeforeIndices(text, indices) {
  const unique = [...new Set(indices)].sort((a, b) => b - a);
  let out = text;
  for (const idx of unique) {
    if (idx <= 0) continue;
    let start = idx;
    while (start > 0 && /[\s;]/.test(out[start - 1])) start -= 1;
    if (start > 0 && out[start - 1] === "\n") continue;
    let end = idx;
    while (end < out.length && out[end] === " ") end += 1;
    out = `${out.slice(0, start)}\n${out.slice(end)}`;
  }
  return out;
}

function collectMatchIndices(text, re) {
  const indices = [];
  const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  for (const m of text.matchAll(global)) {
    if (m.index === undefined) continue;
    if (isParenRangeBefore(text, m.index)) continue;
    indices.push(m.index);
  }
  return indices;
}

function breakSeries(text, re, minCount) {
  const indices = collectMatchIndices(text, re);
  if (indices.length < minCount) return text;
  return insertBreaksBeforeIndices(text, indices);
}

function breakSemicolonLetterItems(text) {
  const hits = [...text.matchAll(/(?<![a-zA-Z])([a-z])\)\s*/gi)];
  if (hits.length < 2) return text;
  return text.replace(/;\s*([a-z])\)\s*/gi, ";\n$1) ");
}

function breakAfterColonIntro(text) {
  let s = text;
  const hasArabicDot = (s.match(/(?<!\d)(?<![\d.])(\d{1,2})\.\s+/g) ?? []).length >= 2;
  const hasArabicParen = (s.match(/(?<!\d)(\d{1,2})\)\s+/g) ?? []).length >= 2;
  const hasLetter = (s.match(/(?<![a-zA-Z])([a-z])\)\s+/gi) ?? []).length >= 2;
  const hasRoman = (s.match(/\b([IVX]{1,4})\)\s+/gi) ?? []).length >= 2;

  if (hasArabicDot) s = s.replace(/:\s+(?=\d{1,2}\.\s)/g, ":\n");
  if (hasArabicParen) s = s.replace(/:\s+(?=\d{1,2}\)\s)/g, ":\n");
  if (hasLetter) s = s.replace(/:\s+(?=[a-z]\)\s)/gi, ":\n");
  if (hasRoman) s = s.replace(/:\s+(?=[IVX]{1,4}\)\s)/gi, ":\n");
  return s;
}

const LIST_MARKER_IN_SEGMENT =
  /\b[IVX]{1,4}\)|(?<!\d)(\d{1,2})[.)]|(?<![a-zA-Z])([a-z])\)/i;

function breakAfterListBlock(text) {
  return text.replace(
    /([.!?;])([ \t]+)(?=[A-ZĄĆĘŁŃÓŚŹŻ])/gu,
    (match, punct, sp, offset, whole) => {
      const lineStart = whole.lastIndexOf("\n", offset - 1) + 1;
      const segment = whole.slice(lineStart, offset);
      if (!LIST_MARKER_IN_SEGMENT.test(segment)) {
        return match;
      }
      return `${punct}\n\n`;
    },
  );
}

function breakLabeledSublist(text) {
  let s = text.replace(
    /([.!?]\s*|\n\n|^)([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż\s]{1,30}):\s*(?=[a-z]\)\s)/gi,
    "$1$2:\n",
  );
  s = s.replace(
    /([.!?])\s+(Grupy|Prawidłowe|Temperatury|Opcje|Wskazówki):/gi,
    "$1\n\n$2:",
  );
  return s;
}

function normalizeQuestionListText(text) {
  if (!text?.trim() || text.length < 25) return text;

  let s = text.replace(/\r\n/g, "\n");
  s = breakSemicolonLetterItems(s);
  s = breakAfterColonIntro(s);
  s = breakLabeledSublist(s);
  s = breakSeries(s, /\b([IVX]{1,4})\)\s+/gi, 2);
  s = breakSeries(s, /(?<!\d)(\d{1,2})\)\s+/g, 2);
  s = breakSeries(s, /(?<![a-zA-Z])([a-z])\)\s+/gi, 2);
  s = breakSeries(s, /(?<!\d)(?<![\d.])(\d{1,2})\.\s+/g, 2);
  s = breakAfterListBlock(s);
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

// —— env ——

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function fetchAllQuestions(supabase) {
  const rows = [];
  const page = 500;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, text, explanation")
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return rows;
}

// —— main ——

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const dryRun = args.includes("--dry-run") || !apply;

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const rows = await fetchAllQuestions(supabase);
const changes = [];

for (const row of rows) {
  const text = normalizeQuestionListText(row.text);
  const explanation = normalizeQuestionListText(row.explanation);
  if (text !== row.text || explanation !== row.explanation) {
    changes.push({ id: row.id, text, explanation, beforeText: row.text });
  }
}

console.log(`Przeskanowano: ${rows.length}, do zmiany: ${changes.length}`);

if (changes.length > 0) {
  console.log("\nPrzykłady (max 5):");
  for (const c of changes.slice(0, 5)) {
    console.log(`\n--- ${c.id} ---`);
    console.log("PRZED:", c.beforeText.slice(0, 220).replace(/\n/g, " ↵ "));
    console.log("PO:   ", c.text.slice(0, 280).replace(/\n/g, " ↵ "));
  }
}

if (dryRun) {
  console.log("\nDry-run — bez zapisu. Uruchom z --apply aby zapisać.");
  process.exit(0);
}

let ok = 0;
let err = 0;
for (const c of changes) {
  const { error } = await supabase
    .from("questions")
    .update({ text: c.text, explanation: c.explanation })
    .eq("id", c.id);
  if (error) {
    console.error(c.id, error.message);
    err += 1;
  } else {
    ok += 1;
  }
}

console.log(`\nZapisano: ${ok}, błędy: ${err}`);
