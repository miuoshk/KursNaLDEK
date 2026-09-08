#!/usr/bin/env node
/**
 * CSV klikalności dystraktorów dla fabryki (UFO KROK 9).
 *
 *   node scripts/export-distractor-stats.mjs --subject ldew-chirurgia-stomatologiczna
 *   node scripts/export-distractor-stats.mjs --subject X --refresh --out exports/x.csv
 *
 * Progi (pct_of_wrong / pct_of_wrong_first): ≥15% pisz, 3–15% opcjonalnie, <3% martwy.
 * CSV ma obie wersje: wszystkie próby i pierwsza próba user×pytanie.
 * Wymaga: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

export function classifyDistractorRecommendation(pctOfWrong, isCorrect) {
  if (isCorrect) return "klucz";
  if (pctOfWrong == null || Number(pctOfWrong) < 3) return "martwy dystraktor";
  if (Number(pctOfWrong) < 15) return "opcjonalnie";
  return "pisz";
}

function loadEnvFiles() {
  for (const name of [".env.local", ".env.staging"]) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

function parseArgs(argv) {
  const args = {
    subjectId: null,
    out: null,
    refresh: false,
    limit: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--subject" && argv[i + 1]) args.subjectId = argv[++i];
    else if (arg === "--out" && argv[i + 1]) args.out = argv[++i];
    else if (arg === "--limit" && argv[i + 1]) args.limit = Number(argv[++i]);
    else if (arg === "--refresh") args.refresh = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function optionText(options, optionId) {
  if (!Array.isArray(options)) return "";
  const match = options.find((item) => item && item.id === optionId);
  return match?.text ?? "";
}

async function fetchAllStats(supabase) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("distractor_stats_90d")
      .select(
        "question_id, option_id, n_selected, n_total, pct_of_answers, pct_of_wrong, n_first_attempt, pct_of_wrong_first",
      )
      .order("question_id", { ascending: true })
      .order("option_id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function fetchQuestions(supabase, ids) {
  const byId = new Map();
  const chunk = 200;
  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk);
    const { data, error } = await supabase
      .from("questions")
      .select("id, correct_option_id, options, topic_id, topics!inner(subject_id)")
      .in("id", slice);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      byId.set(row.id, row);
    }
  }
  return byId;
}

export async function buildDistractorRows(supabase, subjectId) {
  const stats = await fetchAllStats(supabase);
  const questionIds = [...new Set(stats.map((row) => row.question_id))];
  const questions = await fetchQuestions(supabase, questionIds);
  const rows = [];
  for (const row of stats) {
    const question = questions.get(row.question_id);
    const subject = question?.topics?.subject_id ?? "";
    if (subjectId && subject !== subjectId) continue;
    const isCorrect = question?.correct_option_id === row.option_id;
    rows.push({
      subject_id: subject,
      question_id: row.question_id,
      option_id: row.option_id,
      option_text: optionText(question?.options, row.option_id),
      n_selected: row.n_selected,
      n_total: row.n_total,
      pct_of_answers: row.pct_of_answers,
      pct_of_wrong: row.pct_of_wrong,
      n_first_attempt: row.n_first_attempt,
      pct_of_wrong_first: row.pct_of_wrong_first,
      recommendation: classifyDistractorRecommendation(
        row.pct_of_wrong,
        isCorrect,
      ),
      recommendation_first: classifyDistractorRecommendation(
        row.pct_of_wrong_first,
        isCorrect,
      ),
    });
  }
  rows.sort(
    (a, b) =>
      b.n_total - a.n_total ||
      a.question_id.localeCompare(b.question_id) ||
      a.option_id.localeCompare(b.option_id),
  );
  return rows;
}

function toCsv(rows) {
  const header = [
    "subject_id",
    "question_id",
    "option_id",
    "option_text",
    "n_selected",
    "n_total",
    "pct_of_answers",
    "pct_of_wrong",
    "n_first_attempt",
    "pct_of_wrong_first",
    "recommendation",
    "recommendation_first",
  ];
  return [
    header.join(","),
    ...rows.map((row) => header.map((key) => csvEscape(row[key])).join(",")),
    "",
  ].join("\n");
}

async function main() {
  loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      "usage: node scripts/export-distractor-stats.mjs [--subject ID] [--refresh] [--limit N] [--out path]",
    );
    process.exit(0);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (args.refresh) {
    const { error } = await supabase.rpc("refresh_distractor_stats_90d");
    if (error) {
      console.error("refresh_distractor_stats_90d:", error.message);
      process.exit(1);
    }
  }

  let rows = await buildDistractorRows(supabase, args.subjectId);
  if (args.limit) rows = rows.slice(0, args.limit);
  const csv = toCsv(rows);
  if (args.out) {
    const outPath = resolve(process.cwd(), args.out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, csv);
    console.error(`wrote ${rows.length} rows → ${outPath}`);
  } else {
    process.stdout.write(csv);
  }
}

const invoked =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (invoked) void main();
