#!/usr/bin/env node
/**
 * Przywraca pytań PHUM-*-GEN z pliku backup JSON.
 *
 *   node scripts/phum-gen-restore.mjs --from exports/prof-humanizm-gen-backup-2026-06-13.json --dry-run
 *   node scripts/phum-gen-restore.mjs --from exports/prof-humanizm-gen-backup-2026-06-13.json --apply
 *   node scripts/phum-gen-restore.mjs --from ... --sql exports/rollback-run.sql
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

function parseArgs(argv) {
  const args = { from: null, dryRun: false, apply: false, sql: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--from" && argv[i + 1]) args.from = argv[++i];
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--apply") args.apply = true;
    else if (arg === "--sql" && argv[i + 1]) args.sql = argv[++i];
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.from) {
    console.log(`Użycie:
  node scripts/phum-gen-restore.mjs --from <backup.json> [--dry-run | --apply | --sql out.sql]

Przywraca stan pytań sprzed edycji (text, options, correct_option_id, explanation).
`);
    process.exit(args.help ? 0 : 1);
  }

  if (!args.dryRun && !args.apply && !args.sql) {
    console.error("Podaj --dry-run, --apply albo --sql <path>");
    process.exit(1);
  }

  const backupPath = resolve(args.from);
  if (!existsSync(backupPath)) {
    console.error(`Brak pliku: ${backupPath}`);
    process.exit(1);
  }

  const backup = JSON.parse(readFileSync(backupPath, "utf8"));
  const rows = backup.questions ?? [];
  console.log(`Backup: ${backup.exportedAt ?? "?"} · ${rows.length} pytań`);

  if (args.sql) {
    const sql = `-- Rollback from ${backupPath}\n-- Exported: ${backup.exportedAt}\n\nBEGIN;\n\n${rows.map(rowToUpdateSQL).join("\n\n")}\n\nCOMMIT;\n`;
    writeFileSync(resolve(args.sql), sql, "utf8");
    console.log(`Zapisano SQL → ${resolve(args.sql)}`);
    return;
  }

  if (args.dryRun) {
    console.log("Dry-run: zaktualizowałoby", rows.length, "pytań");
    console.log("IDs:", rows.slice(0, 5).map((r) => r.id).join(", "), rows.length > 5 ? "…" : "");
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
  let ok = 0;
  let fail = 0;

  for (const row of rows) {
    const { error } = await supabase
      .from("questions")
      .update({
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
      })
      .eq("id", row.id);

    if (error) {
      console.error(`FAIL ${row.id}:`, error.message);
      fail += 1;
    } else {
      ok += 1;
    }
  }

  console.log(`Restore zakończony: OK=${ok}, FAIL=${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
