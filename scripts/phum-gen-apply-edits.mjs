#!/usr/bin/env node
/**
 * Stosuje edycje opcji PHUM-*-GEN z pliku JSON (z walidacją długości).
 *
 * Format edits.json:
 * {
 *   "label": "phum-psy-gen-length-fix-1",
 *   "edits": [
 *     { "id": "phum-psy-gen-001", "options": [...], "correct_option_id": "c", "explanation": "..." }
 *   ]
 * }
 *
 *   node scripts/phum-gen-apply-edits.mjs --from exports/phum-psy-gen-edits.json --dry-run
 *   node scripts/phum-gen-apply-edits.mjs --from exports/phum-psy-gen-edits.json --apply
 */

import { existsSync, readFileSync } from "node:fs";
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

function analyze(edit) {
  const lens = Object.fromEntries(
    (edit.options ?? []).map((o) => [o.id, (o.text ?? "").trim().length]),
  );
  const sorted = Object.entries(lens).sort((a, b) => b[1] - a[1]);
  const maxLen = sorted[0][1];
  const longestIds = sorted.filter(([, l]) => l === maxLen).map(([id]) => id);
  const rank = sorted.findIndex(([id]) => id === edit.correct_option_id) + 1;
  const onlyLongest =
    longestIds.length === 1 && longestIds[0] === edit.correct_option_id;
  return { rank, onlyLongest, longestIds, lens };
}

function validateEdit(edit) {
  const errors = [];
  if (!edit.id) errors.push("brak id");
  if (!edit.correct_option_id) errors.push("brak correct_option_id");
  const ids = (edit.options ?? []).map((o) => o.id);
  if (ids.length !== 5 || new Set(ids).size !== 5) errors.push("options != 5 unikalnych");
  if (!ids.includes(edit.correct_option_id)) errors.push("correct_option_id nie w options");
  for (const o of edit.options ?? []) {
    if (!o.text?.trim()) errors.push(`pusta opcja ${o.id}`);
  }
  const { onlyLongest } = analyze(edit);
  if (onlyLongest) errors.push("poprawna = jedyna najdłuższa (FAIL)");
  return errors;
}

function parseArgs(argv) {
  const args = { from: null, dryRun: false, apply: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--from" && argv[i + 1]) args.from = argv[++i];
    else if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--apply") args.apply = true;
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.from) {
    console.log(`Użycie:
  node scripts/phum-gen-apply-edits.mjs --from <edits.json> [--dry-run | --apply]
`);
    process.exit(args.help ? 0 : 1);
  }
  if (!args.dryRun && !args.apply) {
    console.error("Podaj --dry-run lub --apply");
    process.exit(1);
  }

  const payload = JSON.parse(readFileSync(resolve(args.from), "utf8"));
  const edits = payload.edits ?? [];
  console.log(`Edycje: ${edits.length} · label: ${payload.label ?? "?"}`);

  const failed = [];
  const ok = [];
  for (const edit of edits) {
    const errors = validateEdit(edit);
    const meta = analyze(edit);
    if (errors.length) {
      failed.push({ id: edit.id, errors, rank: meta.rank });
    } else {
      ok.push({ id: edit.id, rank: meta.rank });
    }
  }

  if (failed.length) {
    console.error(`\nWalidacja FAIL: ${failed.length}/${edits.length}`);
    for (const f of failed.slice(0, 20)) {
      console.error(`  ${f.id}: ${f.errors.join("; ")}`);
    }
    process.exit(1);
  }

  const rankHist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const o of ok) rankHist[o.rank] += 1;
  console.log("Rank poprawnej (1=najdłuższa):", rankHist);
  console.log(`OK: ${ok.length}/${edits.length}`);

  if (args.dryRun) return;

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Brak env Supabase");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  let applied = 0;
  for (const edit of edits) {
    const patch = {
      options: edit.options,
      correct_option_id: edit.correct_option_id,
    };
    if (edit.explanation != null) patch.explanation = edit.explanation;
    if (edit.text != null) patch.text = edit.text;

    const { error } = await supabase.from("questions").update(patch).eq("id", edit.id);
    if (error) {
      console.error(`FAIL ${edit.id}:`, error.message);
      process.exit(1);
    }
    applied += 1;
  }
  console.log(`Zastosowano: ${applied} pytań`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
