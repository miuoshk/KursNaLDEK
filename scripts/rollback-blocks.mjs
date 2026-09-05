#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stderr as output } from "node:process";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  createServiceClient,
  idsFromReport,
  parseIdsFile,
} from "./lib/applyBlocksLib.mjs";

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
    if (value === "--from-report") {
      args.set("from-report", argv[index + 1]);
      index += 1;
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
const projectRef = args.get("project-ref");
const reportPath = args.get("from-report");
const idsPath = positional[0];

if (!reportPath && !idsPath) {
  console.error(
    "Użycie: node scripts/rollback-blocks.mjs <ids.txt|--from-report plik.md> [--project-ref REF] [--apply]",
  );
  process.exit(1);
}

const ids = reportPath
  ? idsFromReport(await readFile(resolve(reportPath), "utf8"))
  : parseIdsFile(await readFile(resolve(idsPath), "utf8"));

if (ids.length === 0) {
  console.error("Brak identyfikatorów do rollbacku.");
  process.exit(1);
}

if (!apply) {
  console.log(
    JSON.stringify({ dryRun: true, ids, hint: "Dodaj --apply, aby cofnąć." }, null, 2),
  );
  process.exit(0);
}

const rl = createInterface({ input, output });
const answer = await rl.question(
  `Wpisz TAK, aby cofnąć bloki dla ${ids.length} pytań: `,
);
rl.close();
if (answer.trim() !== "TAK") {
  console.error("Anulowano.");
  process.exit(1);
}

const supabase = createServiceClient(createClient, {
  projectRef,
  url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

const { data, error } = await supabase.rpc("rollback_explanation_blocks", {
  ids,
});
if (error) throw error;

console.log(JSON.stringify(data, null, 2));
