#!/usr/bin/env node
/**
 * Jawny format zestawienia → explanation_blocks v2.
 * Nie odtwarza prawda/fałsz z prozy.
 *
 *   npx tsx scripts/parse-statement-set-v1.ts <in.jsonl>
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseStatementSetV1,
  type StatementSetParseInput,
} from "./lib/parseStatementSetV1";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseJsonl(text: string): StatementSetParseInput[] {
  const rows: StatementSetParseInput[] = [];
  for (const [lineIndex, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    try {
      const row = JSON.parse(line) as StatementSetParseInput;
      if (!row.id || !row.correct_option_id || !row.options) {
        throw new Error("brak id / options / correct_option_id");
      }
      rows.push(row);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`JSONL linia ${lineIndex + 1}: ${reason}`);
    }
  }
  return rows;
}

async function main() {
  const inFile = process.argv[2];
  if (!inFile) {
    console.error("Użycie: npx tsx scripts/parse-statement-set-v1.ts <in.jsonl>");
    process.exit(1);
  }
  const outFile = resolve(root, "scripts/out/statement-set-v1.jsonl");
  const reportFile = resolve(root, "scripts/out/statement-set-v1-report.md");
  const inputs = parseJsonl(await readFile(resolve(inFile), "utf8"));
  const results = inputs.map((input) => parseStatementSetV1(input));
  const accepted = results.filter((row) => row.item);
  const jsonl = accepted.map((row) => JSON.stringify(row.item)).join("\n");
  const report = [
    "# parse-statement-set-v1",
    "",
    `total: ${results.length}`,
    `accepted: ${accepted.length}`,
    `rejected: ${results.length - accepted.length}`,
    "",
    "## odrzucone",
    "",
    ...results
      .filter((row) => !row.accepted)
      .map((row) => {
        const flag = row.flags[0];
        return `- ${row.id}: ${flag?.code ?? "unknown"} — ${flag?.detail ?? ""}`;
      }),
    "",
  ].join("\n");

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, jsonl ? `${jsonl}\n` : "", "utf8");
  await writeFile(reportFile, report, "utf8");
  console.error(
    `accepted ${accepted.length}/${results.length}; out ${outFile}; report ${reportFile}`,
  );
  process.stdout.write(report);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
