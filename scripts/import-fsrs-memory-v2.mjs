#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");
const inputArg = process.argv.slice(2).find((value) => !value.startsWith("--"));
if (!inputArg) {
  console.error(
    "Użycie: node scripts/import-fsrs-memory-v2.mjs <rebuild.jsonl> [--apply]",
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (apply && (!url || !serviceRole)) {
  throw new Error(
    "Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const supabase = apply
  ? createClient(url, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
const BATCH_SIZE = 500;
let batch = [];
let imported = 0;
let processed = 0;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateRow(row, lineNumber) {
  const finite = ["stability", "difficulty"].every((key) =>
    Number.isFinite(Number(row[key])),
  );
  const nonnegativeIntegers = [
    "elapsed_days",
    "scheduled_days",
    "learning_steps",
    "reps",
    "lapses",
  ].every((key) => Number.isInteger(Number(row[key])) && Number(row[key]) >= 0);
  if (
    !UUID_RE.test(String(row.user_id ?? "")) ||
    !UUID_RE.test(String(row.parameter_set_id ?? "")) ||
    !String(row.question_id ?? "") ||
    row.scheduler_version !== "memory-v2/ts-fsrs-5.4.1" ||
    !["new", "learning", "review", "relearning"].includes(row.state) ||
    !["live", "replay", "seed-v1"].includes(row.source) ||
    !finite ||
    !nonnegativeIntegers ||
    Number(row.stability) < 0 ||
    Number(row.difficulty) < 1 ||
    Number(row.difficulty) > 10 ||
    ![1, 2, 3, 4].includes(Number(row.last_rating)) ||
    Number.isNaN(new Date(row.next_review).getTime()) ||
    Number.isNaN(new Date(row.last_answered_at).getTime()) ||
    Number.isNaN(new Date(row.updated_at).getTime())
  ) {
    throw new Error(`Nieprawidłowy wiersz pamięci v2 w linii ${lineNumber}.`);
  }
  return row;
}

async function flush() {
  if (batch.length === 0) return;
  const rows = batch;
  batch = [];
  processed += rows.length;
  if (!supabase) {
    imported += rows.length;
    return;
  }
  const { data, error } = await supabase.rpc("import_fsrs_memory_v2", {
    p_rows: rows,
  });
  if (error) throw error;
  imported += Number(data ?? 0);
  console.log(
    `Przetworzono ${processed.toLocaleString("pl-PL")}, ` +
      `zastosowano ${imported.toLocaleString("pl-PL")} kart`,
  );
}

const input = createInterface({
  input: createReadStream(resolve(inputArg), { encoding: "utf8" }),
  crlfDelay: Infinity,
});
let lineNumber = 0;
for await (const rawLine of input) {
  lineNumber += 1;
  const line = rawLine.trim();
  if (!line) continue;
  batch.push(validateRow(JSON.parse(line), lineNumber));
  if (batch.length >= BATCH_SIZE) await flush();
}
await flush();
if (!apply) {
  console.log(
    `Dry-run: zweryfikowano ${processed.toLocaleString("pl-PL")} kart. ` +
      "Dodaj --apply, aby je zaimportować.",
  );
}
