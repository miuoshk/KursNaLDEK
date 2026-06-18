#!/usr/bin/env node
/**
 * Normalizacja inline list — questions.text i explanation
 *
 *   node scripts/normalize-question-list-format.mjs --dry-run
 *   node scripts/normalize-question-list-format.mjs --apply
 *   node scripts/normalize-question-list-format.mjs --apply --subject biofizyka --fields explanation
 *
 * Wymaga: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (np. z .env.local)
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// —— logika zsynchronizowana z lib/content/normalizeQuestionListText.ts ——

const PAREN_ENUM = /\([\da-zA-Z]+[-–][\da-zA-Z]*$/;
const MATH_PLACEHOLDER = "\uE000";

function maskInlineMath(text) {
  const segments = [];
  const masked = text.replace(/\$[^$\n]+\$/g, (match) => {
    const id = segments.length;
    segments.push(match);
    return `${MATH_PLACEHOLDER}${id}${MATH_PLACEHOLDER}`;
  });
  return { masked, segments };
}

function unmaskInlineMath(text, segments) {
  return text.replace(
    new RegExp(`${MATH_PLACEHOLDER}(\\d+)${MATH_PLACEHOLDER}`, "g"),
    (_, id) => segments[Number(id)] ?? "",
  );
}

function isParenRangeBefore(text, index) {
  const slice = text.slice(Math.max(0, index - 12), index);
  return PAREN_ENUM.test(slice);
}

function isInsideParentheses(text, index) {
  let depth = 0;
  for (let i = 0; i < index; i += 1) {
    const ch = text[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
  }
  return depth > 0;
}

function isFunctionArgumentContext(text, index) {
  let i = index - 1;
  while (i >= 0 && text[i] === " ") i -= 1;
  if (i >= 0 && text[i] === "(") return true;
  if (i >= 0 && /[\/^=]/.test(text[i])) return true;
  return false;
}

function isFalseArabicDotList(text, index) {
  let i = index - 1;
  while (i >= 0 && text[i] === " ") i -= 1;
  if (i >= 0 && /[<>=^]/.test(text[i])) return true;
  const tail = text.slice(index);
  if (
    i >= 0 &&
    /[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(text[i]) &&
    !/^\d{1,2}\.\s+(\*\*|\d)/.test(tail)
  ) {
    return true;
  }
  if (/^\d{1,2}\.\s+\d{1,2}(?:\s|[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ(])/.test(tail)) {
    return true;
  }
  return false;
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
    if (isFunctionArgumentContext(text, m.index)) continue;
    if (re.source.includes("([a-z])") && isInsideParentheses(text, m.index)) continue;
    if (re.source.includes("\\d{1,2}") && re.source.includes("\\.")) {
      if (isFalseArabicDotList(text, m.index)) continue;
    }
    const prev = m.index > 0 ? text[m.index - 1] : "";
    if (prev === "*" || prev === "_") continue;
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
  const hits = [...text.matchAll(/(?<![a-zA-Z=(])([a-z])\)\s+/gi)].filter(
    (m) => m.index !== undefined && !isFunctionArgumentContext(text, m.index),
  );
  if (hits.length < 2) return text;
  return text.replace(/;\s*([a-z])\)\s*/gi, ";\n$1) ");
}

function breakAfterColonIntro(text) {
  let s = text;
  const hasArabicDot = (s.match(/(?<!\d)(?<![\d.])(\d{1,2})\.\s+/g) ?? []).length >= 2;
  const hasArabicParen = (s.match(/(?<!\d)(\d{1,2})\)\s+/g) ?? []).length >= 2;
  const hasLetter =
    [...s.matchAll(/(?<![a-zA-Z=(])([a-z])\)\s+/gi)].filter(
      (m) => m.index !== undefined && !isFunctionArgumentContext(s, m.index),
    ).length >= 2;
  const hasRoman = (s.match(/\b([IVX]{1,4})\)\s+/g) ?? []).length >= 2;
  const hasRomanDot = (s.match(/\b([IVX]{1,4})\.\s+/g) ?? []).length >= 2;

  if (hasArabicDot) s = s.replace(/:\s+(?=\d{1,2}\.\s)/g, ":\n");
  if (hasArabicParen) s = s.replace(/:\s+(?=\d{1,2}\)\s)/g, ":\n");
  if (hasLetter) s = s.replace(/:\s+(?=[a-z]\)\s)/gi, ":\n");
  if (hasRoman) s = s.replace(/:\s+(?=[IVX]{1,4}\)\s)/g, ":\n");
  if (hasRomanDot) s = s.replace(/:\s+(?=[IVX]{1,4}\.\s)/g, ":\n");
  return s;
}

function breakAfterListBlock(text) {
  return text.replace(
    /([.!?;])([ \t]+)(?=[A-ZĄĆĘŁŃÓŚŹŻ])/gu,
    (match, punct, _sp, offset, whole) => {
      const lineStart = whole.lastIndexOf("\n", offset - 1) + 1;
      const segment = whole.slice(lineStart, offset);
      const tail = segment.split(";").pop()?.trim() ?? segment.trim();
      if (!/^(\d{1,2}[.)]|[a-z]\)|[IVX]{1,4}[.)])/i.test(tail)) {
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
  const { masked, segments } = maskInlineMath(s);
  s = masked;

  s = breakSemicolonLetterItems(s);
  s = breakAfterColonIntro(s);
  s = breakLabeledSublist(s);
  s = breakSeries(s, /\b([IVX]{1,4})\)\s+/g, 2);
  s = breakSeries(s, /\b([IVX]{1,4})\.\s+/g, 2);
  s = breakSeries(s, /(?<!\d)(\d{1,2})\)\s+/g, 2);
  s = breakSeries(s, /(?<![a-zA-Z=(])([a-z])\)\s+/gi, 2);
  s = breakSeries(s, /(?<!\d)(?<![\d.])(\d{1,2})\.\s+/g, 2);
  s = breakAfterListBlock(s);

  s = unmaskInlineMath(s, segments);
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

async function fetchQuestions(supabase, subjectId) {
  let query = supabase.from("questions").select("id, text, explanation, topic_id, topics(subject_id)");

  if (subjectId) {
    const { data: topics, error: topicErr } = await supabase
      .from("topics")
      .select("id")
      .eq("subject_id", subjectId);
    if (topicErr) throw topicErr;
    const topicIds = topics.map((t) => t.id);
    query = query.in("topic_id", topicIds).eq("is_active", true);
  }

  const rows = [];
  const page = 500;
  let from = 0;
  while (true) {
    const { data, error } = await query.range(from, from + page - 1);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return rows;
}

function parseArgValue(args, flag) {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return null;
  return args[i + 1];
}

// —— main ——

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const dryRun = args.includes("--dry-run") || !apply;
const subjectId = parseArgValue(args, "--subject");
const fieldsRaw = parseArgValue(args, "--fields") ?? "text,explanation";
const fields = new Set(fieldsRaw.split(",").map((f) => f.trim()).filter(Boolean));

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const rows = await fetchQuestions(supabase, subjectId);
const changes = [];

for (const row of rows) {
  const updates = {};
  if (fields.has("text")) {
    const text = normalizeQuestionListText(row.text);
    if (text !== row.text) updates.text = text;
  }
  if (fields.has("explanation")) {
    const explanation = normalizeQuestionListText(row.explanation ?? "");
    if (explanation !== (row.explanation ?? "")) updates.explanation = explanation;
  }
  if (Object.keys(updates).length > 0) {
    changes.push({ id: row.id, ...updates, beforeText: row.text, beforeExplanation: row.explanation });
  }
}

const scope = subjectId ? `subject=${subjectId}` : "cała baza";
const fieldScope = [...fields].join("+");
console.log(`Zakres: ${scope}, pola: ${fieldScope}`);
console.log(`Przeskanowano: ${rows.length}, do zmiany: ${changes.length}`);

if (changes.length > 0) {
  console.log("\nPrzykłady (max 5):");
  for (const c of changes.slice(0, 5)) {
    console.log(`\n--- ${c.id} ---`);
    if (c.text !== undefined) {
      console.log("text PRZED:", (c.beforeText ?? "").slice(0, 220).replace(/\n/g, " ↵ "));
      console.log("text PO:   ", c.text.slice(0, 280).replace(/\n/g, " ↵ "));
    }
    if (c.explanation !== undefined) {
      console.log("expl PRZED:", (c.beforeExplanation ?? "").slice(0, 220).replace(/\n/g, " ↵ "));
      console.log("expl PO:   ", c.explanation.slice(0, 280).replace(/\n/g, " ↵ "));
    }
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
    .update(
      Object.fromEntries(
        Object.entries({ text: c.text, explanation: c.explanation }).filter(([, v]) => v !== undefined),
      ),
    )
    .eq("id", c.id);
  if (error) {
    console.error(c.id, error.message);
    err += 1;
  } else {
    ok += 1;
  }
}

console.log(`\nZapisano: ${ok}, błędy: ${err}`);
