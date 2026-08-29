/**
 * Strumieniowy export historii do JSONL pod replay FSRS.
 * To samo źródło co scripts/2026-08-25-export-learning-replay.sql,
 * przez RPC service-role (bez COPY/psql).
 */
import { createWriteStream, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
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

loadEnvLocal();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const outputPath = resolve(
  process.argv.find((value, index) => index >= 2 && !value.startsWith("--")) ??
    "exports/learning-replay-history.jsonl",
);
// PostgREST obcina wynik RPC do db-max-rows (domyślnie 1000). Nie wolno
// traktować niepełnej strony > tego limitu jako końca eksportu.
const PAGE = 1000;
const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const output = createWriteStream(outputPath, { encoding: "utf8" });
let afterUser = null;
let afterQuestion = null;
let afterAnswered = null;
let afterId = null;
let written = 0;
const started = Date.now();

while (true) {
  const { data, error } = await supabase.rpc("export_learning_replay_page", {
    p_limit: PAGE,
    p_after_user: afterUser,
    p_after_question: afterQuestion,
    p_after_answered: afterAnswered,
    p_after_id: afterId,
  });
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) break;
  for (const row of rows) {
    const payload = {
      user_id: row.user_id,
      product: row.product,
      track: row.track,
      cohort_key: row.cohort_key,
      question_id: row.question_id,
      answered_at: row.answered_at,
      is_correct: row.is_correct,
      confidence: row.confidence,
      rating_source: row.rating_source,
      session_kind: row.session_kind,
      time_spent_seconds: row.time_spent_seconds,
    };
    if (!output.write(`${JSON.stringify(payload)}\n`)) {
      await new Promise((resolveWrite) => output.once("drain", resolveWrite));
    }
  }
  written += rows.length;
  const last = rows[rows.length - 1];
  afterUser = last.user_id;
  afterQuestion = last.question_id;
  afterAnswered = last.answered_at;
  afterId = last.answer_id;
  if (written % 20_000 === 0 || rows.length < PAGE) {
    const elapsed = ((Date.now() - started) / 1000).toFixed(0);
    console.log(`Export ${written.toLocaleString("pl-PL")} wierszy (${elapsed}s)`);
  }
  if (rows.length < PAGE) break;
}

await new Promise((resolveClose, reject) => {
  output.end((error) => (error ? reject(error) : resolveClose()));
});
console.log(
  `Gotowe: ${written.toLocaleString("pl-PL")} wierszy → ${outputPath}`,
);
