#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stderr as output } from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  ALLOWED_SOURCES,
  BATCH_LIMIT,
  chunkItems,
  createServiceClient,
  formatApplyReport,
  parseJsonl,
} from "./lib/applyBlocksLib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = new Map();
  let apply = false;
  const positional = [];
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--apply") {
      apply = true;
      continue;
    }
    if (value?.startsWith("--")) {
      args.set(value.slice(2), argv[index + 1]);
      index += 1;
      continue;
    }
    positional.push(value);
  }
  return { args, apply, positional };
}

const { args, apply, positional } = parseArgs(process.argv);
const file = positional[0];
const source = args.get("source") ?? "parser";
const projectRef = args.get("project-ref");

if (!file) {
  console.error(
    "Użycie: node scripts/apply-blocks.mjs <plik.jsonl> [--source parser|converter|writer|manual] [--project-ref REF] [--apply]",
  );
  process.exit(1);
}

if (!ALLOWED_SOURCES.includes(source)) {
  console.error(`--source musi być jednym z: ${ALLOWED_SOURCES.join(", ")}`);
  process.exit(1);
}

const items = parseJsonl(await readFile(resolve(file), "utf8"));
const chunks = chunkItems(items, BATCH_LIMIT);

if (!apply) {
  console.error(
    `Dry-run: ${items.length} pozycji, ${chunks.length} chunk(ów) po max ${BATCH_LIMIT}. Dodaj --apply, aby zapisać.`,
  );
} else {
  const rl = createInterface({ input, output });
  const answer = await rl.question(
    `Wpisz TAK, aby zapisać ${items.length} bloków (source=${source}): `,
  );
  rl.close();
  if (answer.trim() !== "TAK") {
    console.error("Anulowano.");
    process.exit(1);
  }
}

const supabase = createServiceClient(createClient, {
  projectRef,
  url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

const results = [];
for (const [chunkIndex, chunk] of chunks.entries()) {
  const { data, error } = await supabase.rpc("apply_explanation_blocks", {
    batch: chunk,
    p_source: source,
    p_dry_run: !apply,
  });
  if (error) {
    throw new Error(
      `RPC chunk ${chunkIndex + 1}/${chunks.length}: ${error.message}`,
    );
  }
  const rows = Array.isArray(data?.results) ? data.results : [];
  results.push(...rows);
}

const generatedAt = new Date().toISOString();
const report = formatApplyReport({
  generatedAt,
  source,
  dryRun: !apply,
  file,
  results,
  chunkCount: chunks.length,
});

const stamp = generatedAt.replaceAll(":", "").replaceAll(".", "");
const outDir = resolve(root, "scripts/out");
await mkdir(outDir, { recursive: true });
const outPath = resolve(outDir, `apply-${stamp}.md`);
await writeFile(outPath, report, "utf8");

process.stdout.write(report);
console.error(`Raport: ${outPath}`);
