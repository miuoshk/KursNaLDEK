#!/usr/bin/env node
/**
 * Standard 1.0 (B.4) → explanation_blocks v2. Bez LLM.
 *
 *   npx tsx scripts/parse-standard-v1.ts <in.jsonl>
 *   npx tsx scripts/parse-standard-v1.ts --from-db ldew-chirurgia-stomatologiczna
 *
 * Wejście JSONL: {id, explanation, options, correct_option_id}
 * Wyjście: out.jsonl (kontrakt batch) + report.md
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  formatParseReport,
  parseStandardV1,
  type ParseInput,
} from "./lib/parseStandardV1";
import {
  charDiffRatio,
  normalizeInvariantText,
  renderExplanationBlocksTs,
} from "./lib/renderExplanationBlocks";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = 200;

function parseJsonlInputs(text: string): ParseInput[] {
  const rows: ParseInput[] = [];
  for (const [lineIndex, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    try {
      const row = JSON.parse(line) as ParseInput;
      if (!row.id || !row.explanation || !row.correct_option_id) {
        throw new Error("brak id / explanation / correct_option_id");
      }
      rows.push(row);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`JSONL linia ${lineIndex + 1}: ${reason}`);
    }
  }
  return rows;
}

async function loadFromDb(subjectId: string): Promise<ParseInput[]> {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Brak SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (prod, read-only).");
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const topics: { id: string }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("topics")
      .select("id")
      .eq("subject_id", subjectId)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    topics.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  const topicIds = topics.map((topic) => topic.id);
  if (topicIds.length === 0) {
    throw new Error(`Brak tematów dla subject=${subjectId}`);
  }
  const rows: ParseInput[] = [];
  for (let index = 0; index < topicIds.length; index += PAGE) {
    const chunk = topicIds.slice(index, index + PAGE);
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from("questions")
        .select("id, explanation, options, correct_option_id")
        .in("topic_id", chunk)
        .order("id")
        .range(from, from + PAGE - 1);
      if (error) throw error;
      for (const row of data ?? []) {
        rows.push({
          id: row.id as string,
          explanation: row.explanation as string,
          options: row.options as ParseInput["options"],
          correct_option_id: row.correct_option_id as string,
        });
      }
      if (!data || data.length < PAGE) break;
    }
  }
  return rows;
}

function parseCli(argv: string[]) {
  let fromDb: string | undefined;
  let outFile = resolve(root, "scripts/out/standard-v1.jsonl");
  let reportFile = resolve(root, "scripts/out/standard-v1-report.md");
  let inFile: string | undefined;
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--from-db") {
      fromDb = argv[index + 1];
      index += 1;
      continue;
    }
    if (value === "--out") {
      outFile = resolve(argv[index + 1] ?? outFile);
      index += 1;
      continue;
    }
    if (value === "--report") {
      reportFile = resolve(argv[index + 1] ?? reportFile);
      index += 1;
      continue;
    }
    if (!value.startsWith("--") && !inFile) inFile = value;
  }
  return { fromDb, outFile, reportFile, inFile };
}

async function main() {
  const { fromDb, outFile, reportFile, inFile } = parseCli(process.argv);

  if (!fromDb && !inFile) {
    console.error(
      "Użycie: npx tsx scripts/parse-standard-v1.ts <in.jsonl|--from-db subject> [--out f] [--report f]",
    );
    process.exit(1);
  }

  const inputs = fromDb
    ? await loadFromDb(fromDb)
    : parseJsonlInputs(await readFile(resolve(inFile!), "utf8"));

  const results = inputs.map((input) => ({
    parsed: parseStandardV1(input),
    input,
  }));

  const invariantOver: { id: string; ratio: number }[] = [];
  for (const { parsed, input } of results) {
    if (!parsed.item) continue;
    const rendered = renderExplanationBlocksTs(
      parsed.item.blocks,
      input.options,
      input.correct_option_id,
    );
    const ratio = charDiffRatio(
      normalizeInvariantText(input.explanation),
      normalizeInvariantText(rendered),
    );
    if (ratio > 0.05) invariantOver.push({ id: parsed.id, ratio });
  }

  const parsedRows = results.map((row) => row.parsed);
  const report = formatParseReport(parsedRows, { invariantOver });
  const seen = new Set<string>();
  const jsonl = parsedRows
    .filter((row) => {
      if (!row.item || seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    })
    .map((row) => JSON.stringify(row.item))
    .join("\n");

  await mkdir(dirname(outFile), { recursive: true });
  await mkdir(dirname(reportFile), { recursive: true });
  if (jsonl) await writeFile(outFile, `${jsonl}\n`, "utf8");
  else await writeFile(outFile, "", "utf8");
  await writeFile(reportFile, report, "utf8");

  const accepted = parsedRows.filter((row) => row.accepted).length;
  console.error(
    `accepted ${accepted}/${parsedRows.length}; invariant>5% ${invariantOver.length}; out ${outFile}; report ${reportFile}`,
  );
  process.stdout.write(report);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
