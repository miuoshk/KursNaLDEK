#!/usr/bin/env node
/**
 * Cofa łamanie list na questions.explanation (masowa migracja normalize-lists).
 * Bezpieczny revert tylko gdy normalize(denormalize(x)) === x.
 *
 *   node scripts/revert-explanation-list-format.mjs --dry-run
 *   node scripts/revert-explanation-list-format.mjs --apply
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// —— zsynchronizowane z lib/content/normalizeQuestionListText.ts ——

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
    const prev = m.index > 0 ? text[m.index - 1] : "";
    if (prev === "(" || prev === "*") continue;
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
    (match, punct, _sp, offset, whole) => {
      const lineStart = whole.lastIndexOf("\n", offset - 1) + 1;
      const segment = whole.slice(lineStart, offset);
      const tail = segment.split(";").pop()?.trim() ?? segment.trim();
      if (!/^(\d{1,2}[.)]|[a-z]\)|[IVX]{1,4}\))/i.test(tail)) return match;
      if (!LIST_MARKER_IN_SEGMENT.test(tail)) return match;
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

function denormalizeQuestionListText(text) {
  if (!text?.trim()) return text;
  let s = text.replace(/\r\n/g, "\n");
  s = s.replace(/\n\n(Grupy|Prawidłowe|Temperatury|Opcje|Wskazówki):/gi, ". $1:");
  s = s.replace(/;\n([a-z])\)\s*/gi, "; $1) ");
  s = s.replace(
    /:\n+(?=\d{1,2}\.\s|\d{1,2}\)\s|[a-z]\)\s|[IVX]{1,4}\)\s)/gi,
    ": ",
  );
  s = s.replace(/([.!?])\n\n(?=[A-ZĄĆĘŁŃÓŚŹŻ])/gu, "$1 ");
  s = s.replace(/\n+(?=\b[IVX]{1,4}\)\s+)/gi, " ");
  s = s.replace(/\n+(?=(?<!\d)\d{1,2}\)\s+)/g, " ");
  s = s.replace(/\n+(?=(?<![a-zA-Z])[a-z]\)\s+)/gi, " ");
  s = s.replace(/\n+(?=(?<!\d)(?<![\d.])\d{1,2}\.\s+)/g, " ");
  return s.replace(/  +/g, " ").replace(/\n +/g, "\n").trim();
}

function canRevert(explanation) {
  const reverted = denormalizeQuestionListText(explanation);
  if (reverted === explanation) return null;
  if (normalizeQuestionListText(reverted) !== explanation) return null;
  return reverted;
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

const apply = process.argv.includes("--apply");
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const rows = [];
const page = 500;
let from = 0;
while (true) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, explanation")
    .range(from, from + page - 1);
  if (error) throw error;
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < page) break;
  from += page;
}

const changes = [];
for (const row of rows) {
  const reverted = canRevert(row.explanation ?? "");
  if (reverted) changes.push({ id: row.id, explanation: reverted });
}

console.log(`Przeskanowano: ${rows.length}, do cofnięcia: ${changes.length}`);

if (changes.length > 0) {
  console.log("\nPrzykłady (max 3):");
  for (const c of changes.slice(0, 3)) {
    const before = rows.find((r) => r.id === c.id)?.explanation ?? "";
    console.log(`\n--- ${c.id} ---`);
    console.log("PRZED:", before.slice(0, 180).replace(/\n/g, " ↵ "));
    console.log("PO:   ", c.explanation.slice(0, 180));
  }
}

if (!apply) {
  console.log("\nDry-run. Uruchom z --apply aby zapisać.");
  process.exit(0);
}

let ok = 0;
for (const c of changes) {
  const { error } = await supabase
    .from("questions")
    .update({ explanation: c.explanation })
    .eq("id", c.id);
  if (error) console.error(c.id, error.message);
  else ok += 1;
}

console.log(`\nCofnięto explanation: ${ok}`);
