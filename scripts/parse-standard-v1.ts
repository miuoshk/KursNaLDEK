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
  type ParseResult,
} from "./lib/parseStandardV1";
import {
  isStructuredStatementSetInput,
  parseStatementSetV1,
} from "./lib/parseStatementSetV1";
import {
  diffSectionInvariants,
  summarizeSectionDiffs,
} from "./lib/sectionInvariant";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = 200;

function parseExplanationInput(input: ParseInput): ParseResult {
  if (isStructuredStatementSetInput(input)) {
    const parsed = parseStatementSetV1(input);
    return {
      id: parsed.id,
      accepted: parsed.accepted,
      flags: parsed.flags.map((flag) => ({
        code:
          flag.code === "prose_not_allowed"
            ? "unparsed_remainder"
            : "unparsed_remainder",
        detail: `${flag.code}: ${flag.detail}`,
      })),
      item: parsed.item,
      verdictText: null,
      originalExplanation: input.explanation ?? "",
    };
  }
  return parseStandardV1(input);
}

function parseJsonlInputs(text: string): ParseInput[] {
  const rows: ParseInput[] = [];
  for (const [lineIndex, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    try {
      const row = JSON.parse(line) as ParseInput;
      if (!row.id || !row.correct_option_id) {
        throw new Error("brak id / correct_option_id");
      }
      if (
        !row.explanation &&
        !isStructuredStatementSetInput(row)
      ) {
        throw new Error("brak explanation albo ustrukturyzowanego zestawienia");
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
  let csvFile = resolve(root, "scripts/out/chs-do-uzupelnienia.csv");
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
    if (value === "--csv") {
      csvFile = resolve(argv[index + 1] ?? csvFile);
      index += 1;
      continue;
    }
    if (!value.startsWith("--") && !inFile) inFile = value;
  }
  return { fromDb, outFile, reportFile, csvFile, inFile };
}

async function main() {
  const { fromDb, outFile, reportFile, csvFile, inFile } = parseCli(process.argv);

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
    parsed: parseExplanationInput(input),
    input,
  }));

  const sectionDiffs = results.flatMap(({ parsed, input }) =>
    isStructuredStatementSetInput(input)
      ? []
      : diffSectionInvariants(input, parsed),
  );
  const sectionInvariant = summarizeSectionDiffs(sectionDiffs);

  const parsedRows = results.map((row) => row.parsed);
  const report = formatParseReport(parsedRows, { sectionInvariant });
  const seen = new Set<string>();
  const jsonl = parsedRows
    .filter((row) => {
      if (!row.item || seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    })
    .map((row) => JSON.stringify(row.item))
    .join("\n");

  const csvLines = ["id,brakujace,powod"];
  const csvSeen = new Set<string>();
  for (const { parsed, input } of results) {
    if (csvSeen.has(parsed.id)) continue;
    csvSeen.add(parsed.id);
    const missing: string[] = [];
    const reasons: string[] = [];
    if (!parsed.accepted) {
      reasons.push(`odrzucone:${parsed.flags.map((flag) => flag.code).join("+") || "unknown"}`);
    }
    const blocks = parsed.item?.blocks;
    if (!blocks?.takeaway) missing.push("takeaway");
    if (!blocks?.trap) missing.push("trap");
    const distractors =
      blocks && "distractors" in blocks ? blocks.distractors : undefined;
    if (blocks?.questionType !== "statement_set") {
      for (const option of input.options) {
        if (option.id === input.correct_option_id) continue;
        if (!distractors?.[option.id]) {
          missing.push(`distractor:${option.id}`);
        }
      }
    }
    for (const flag of parsed.flags) {
      if (
        flag.code === "distractor_unmatched" ||
        flag.code === "takeaway_too_long" ||
        flag.code === "too_long" ||
        flag.code === "unparsed_remainder"
      ) {
        reasons.push(`${flag.code}: ${flag.detail}`);
      }
    }
    if (missing.length === 0) continue;
    if (reasons.length === 0) reasons.push("brak w źródle");
    csvLines.push(
      [parsed.id, missing.join("|"), reasons.join("; ")]
        .map((cell) => `"${cell.replaceAll('"', '""')}"`)
        .join(","),
    );
  }

  await mkdir(dirname(outFile), { recursive: true });
  await mkdir(dirname(reportFile), { recursive: true });
  await mkdir(dirname(csvFile), { recursive: true });
  if (jsonl) await writeFile(outFile, `${jsonl}\n`, "utf8");
  else await writeFile(outFile, "", "utf8");
  await writeFile(reportFile, report, "utf8");
  await writeFile(csvFile, `${csvLines.join("\n")}\n`, "utf8");

  const accepted = parsedRows.filter((row) => row.accepted).length;
  const sectionTotal = Object.values(sectionInvariant).reduce(
    (sum, ids) => sum + ids.length,
    0,
  );
  console.error(
    `accepted ${accepted}/${parsedRows.length}; section-diffs ${sectionTotal}; out ${outFile}; report ${reportFile}; csv ${csvFile}`,
  );
  process.stdout.write(report);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
