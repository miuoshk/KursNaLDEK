#!/usr/bin/env node
/**
 * Backup pytań PHUM-*-GEN (JSON + opcjonalnie SQL rollback).
 *
 *   node scripts/phum-gen-backup.mjs
 *   node scripts/phum-gen-backup.mjs --out exports/prof-humanizm-gen-backup-2026-06-13.json
 *   node scripts/phum-gen-backup.mjs --with-sql
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const PHUM_GEN_TOPICS = ["PHUM-PSY-GEN", "PHUM-SOC-GEN", "PHUM-PRO-GEN"];
const SUBJECT_ID = "lek-prof-humanizm";

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

function escapeSQL(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function rowToUpdateSQL(row) {
  const optionsJSON = JSON.stringify(row.options ?? []).replace(/'/g, "''");
  return `UPDATE public.questions
   SET text = '${escapeSQL(row.text)}',
       options = '${optionsJSON}'::jsonb,
       correct_option_id = '${escapeSQL(row.correct_option_id)}',
       explanation = '${escapeSQL(row.explanation)}',
       batch_label = ${row.batch_label ? `'${escapeSQL(row.batch_label)}'` : "NULL"},
       theme_label = ${row.theme_label ? `'${escapeSQL(row.theme_label)}'` : "NULL"},
       subtheme_label = ${row.subtheme_label ? `'${escapeSQL(row.subtheme_label)}'` : "NULL"},
       learning_outcome = ${row.learning_outcome ? `'${escapeSQL(row.learning_outcome)}'` : "NULL"},
       source_exam = ${row.source_exam ? `'${escapeSQL(row.source_exam)}'` : "NULL"},
       source_code = ${row.source_code ? `'${escapeSQL(row.source_code)}'` : "NULL"}
 WHERE id = '${escapeSQL(row.id)}';`;
}

function toRollbackSQL(rows, meta) {
  const header = `-- ============================================================
-- ROLLBACK: prof-humanizm PHUM-*-GEN
-- Backup:   ${meta.backupLabel}
-- Data:     ${meta.exportedAt}
-- Pytań:    ${rows.length}
--
-- Przywraca text, options, correct_option_id, explanation
-- oraz opcjonalne metadane sprzed edycji długości opcji.
-- Uruchom w Supabase SQL Editor → Run.
-- ============================================================

BEGIN;

`;

  const updates = rows.map((row) => rowToUpdateSQL(row)).join("\n\n");
  const footer = `
COMMIT;

-- Weryfikacja liczników:
UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id IN ('PHUM-PSY-GEN', 'PHUM-SOC-GEN', 'PHUM-PRO-GEN')
       AND COALESCE(is_active, true) = true
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
`;

  return header + updates + footer;
}

function parseArgs(argv) {
  const args = { out: null, withSql: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out" && argv[i + 1]) args.out = argv[++i];
    else if (argv[i] === "--with-sql") args.withSql = true;
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Użycie:
  node scripts/phum-gen-backup.mjs [--out path.json] [--with-sql]

Eksportuje wszystkie aktywne pytania z PHUM-PSY-GEN, PHUM-SOC-GEN, PHUM-PRO-GEN.
`);
    return;
  }

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data: rows, error } = await supabase
    .from("questions")
    .select("*")
    .in("topic_id", PHUM_GEN_TOPICS)
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (error) {
    console.error("Błąd pobierania pytań:", error.message);
    process.exit(1);
  }

  const exportedAt = new Date().toISOString();
  const dateSlug = exportedAt.split("T")[0];
  const backupLabel = `prof-humanizm-gen-backup-${dateSlug}`;
  const jsonPath = resolve(args.out ?? `exports/${backupLabel}.json`);

  const payload = {
    exportedAt,
    purpose: "rollback-before-phum-gen-length-fix",
    subjectId: SUBJECT_ID,
    topicIds: PHUM_GEN_TOPICS,
    count: rows?.length ?? 0,
    questions: (rows ?? []).map((row) => ({
      id: row.id,
      topic_id: row.topic_id,
      text: row.text,
      options: row.options,
      correct_option_id: row.correct_option_id,
      explanation: row.explanation,
      batch_label: row.batch_label,
      theme_label: row.theme_label,
      subtheme_label: row.subtheme_label,
      learning_outcome: row.learning_outcome,
      source_exam: row.source_exam,
      source_code: row.source_code,
      question_type: row.question_type,
      disable_option_shuffle: row.disable_option_shuffle,
      is_active: row.is_active,
    })),
  };

  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Backup JSON: ${rows?.length ?? 0} pytań → ${jsonPath}`);

  const byTopic = {};
  for (const row of rows ?? []) {
    byTopic[row.topic_id] = (byTopic[row.topic_id] ?? 0) + 1;
  }
  console.log("Per temat:", byTopic);

  if (args.withSql || !args.out) {
    const sqlPath = jsonPath.replace(/\.json$/, "-rollback.sql");
    writeFileSync(
      sqlPath,
      toRollbackSQL(rows ?? [], { exportedAt, backupLabel }),
      "utf8",
    );
    console.log(`Rollback SQL: ${sqlPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
