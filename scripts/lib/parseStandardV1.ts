import { parseContrastGfm } from "../../features/shared/lib/explanationBlocks";
import type { ExplanationBlocksV2 } from "../../features/shared/lib/explanationBlocks";
import {
  isNumericOptionList,
  normalizeMatchText,
  numberSetsEqual,
  similarity,
} from "./textSimilarity";

export const MATCH_THRESHOLD = 0.85;
export const ELIMINATION_THRESHOLD = 0.5;

export type ParseFlagCode =
  | "verdict_mismatch"
  | "too_long"
  | "distractor_unmatched"
  | "distractor_matched_by_elimination"
  | "contrast_too_big"
  | "takeaway_too_long"
  | "unparsed_remainder";

export type ParseFlag = {
  code: ParseFlagCode;
  detail: string;
};

export type ParseInput = {
  id: string;
  explanation: string;
  options: readonly { id: string; text: string }[];
  correct_option_id: string;
};

export type BatchItem = {
  id: string;
  source: "parser";
  blocks: ExplanationBlocksV2;
  refs: string[];
};

export type ParseResult = {
  id: string;
  accepted: boolean;
  flags: ParseFlag[];
  item?: BatchItem;
  verdictText: string | null;
  originalExplanation: string;
};

const VERDICT_RE = /^\*\*(?:✅\s*)?Poprawna odpowiedź:\*\*\s*(.+)$/;
const DLACZEGO_RE = /^\*\*Dlaczego nie pozostałe\?\*\*\s*$/;
const DISTRACTOR_RE = /^-\s*\*(.+?)\*\s+[—–-]\s+(.+)$/;
const TRAP_RE = /^>\s*(?:⚠️\s*)?\*\*Pułapka:\*\*\s*(.*)$/;
const TAKEAWAY_RE = /^>\s*(?:💡\s*)?\*\*(?:Haczyk|Zasada):\*\*\s*(.*)$/;
const TABLE_LINE_RE = /^\|.+\|$|^\|.+\|?$/;

function isBlank(line: string): boolean {
  return line.trim().length === 0;
}

function isTableSep(line: string): boolean {
  const trimmed = line.trim();
  return /^\|?[\s:|-]+$/.test(trimmed) && trimmed.includes("-");
}

function isTableLine(line: string): boolean {
  const trimmed = line.trim();
  return TABLE_LINE_RE.test(trimmed) || isTableSep(trimmed);
}

function findBestOption(
  label: string,
  options: ParseInput["options"],
): { id: string; score: number; text: string; via: "numeric" | "similarity" } | null {
  const target = normalizeMatchText(label);
  if (!target) return null;
  const numericHits: ParseInput["options"][number][] = [];
  let best: { id: string; score: number; text: string } | null = null;
  const labelIsNumeric = isNumericOptionList(label);
  for (const option of options) {
    if (isNumericOptionList(option.text)) {
      if (numberSetsEqual(label, option.text)) numericHits.push(option);
      continue;
    }
    if (labelIsNumeric) continue;
    const score = similarity(target, normalizeMatchText(option.text));
    if (!best || score > best.score) {
      best = { id: option.id, score, text: option.text };
    }
  }
  if (numericHits.length === 1) {
    return {
      id: numericHits[0].id,
      score: 1,
      text: numericHits[0].text,
      via: "numeric",
    };
  }
  if (numericHits.length > 1 || labelIsNumeric) return null;
  return best ? { ...best, via: "similarity" } : null;
}

export function parseStandardV1(input: ParseInput): ParseResult {
  const flags: ParseFlag[] = [];
  const lines = input.explanation.replace(/\r\n/g, "\n").split("\n");
  const consumed = new Array<boolean>(lines.length).fill(false);

  const mark = (index: number) => {
    consumed[index] = true;
  };

  let verdictIndex = -1;
  let verdictText: string | null = null;
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].trim().match(VERDICT_RE);
    if (match) {
      verdictIndex = index;
      verdictText = match[1].trim();
      mark(index);
      break;
    }
  }

  const correctOption = input.options.find(
    (option) => option.id === input.correct_option_id,
  );
  if (verdictText && correctOption) {
    const score = similarity(
      normalizeMatchText(verdictText),
      normalizeMatchText(correctOption.text),
    );
    if (normalizeMatchText(verdictText) !== normalizeMatchText(correctOption.text) && score < MATCH_THRESHOLD) {
      flags.push({
        code: "verdict_mismatch",
        detail: `werdykt="${verdictText}" klucz="${correctOption.text}" similarity=${score.toFixed(3)}`,
      });
    } else if (
      normalizeMatchText(verdictText) !== normalizeMatchText(correctOption.text)
    ) {
      flags.push({
        code: "verdict_mismatch",
        detail: `werdykt="${verdictText}" klucz="${correctOption.text}"`,
      });
    }
  } else if (verdictText && !correctOption) {
    flags.push({
      code: "verdict_mismatch",
      detail: `brak opcji klucza ${input.correct_option_id}`,
    });
  }

  let dlaczegoIndex = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (DLACZEGO_RE.test(lines[index].trim())) {
      dlaczegoIndex = index;
      mark(index);
      break;
    }
  }

  const reasonLines: string[] = [];
  if (verdictIndex >= 0 && dlaczegoIndex > verdictIndex) {
    for (let index = verdictIndex + 1; index < dlaczegoIndex; index += 1) {
      if (isTableLine(lines[index])) continue;
      reasonLines.push(lines[index]);
      mark(index);
    }
  } else if (verdictIndex >= 0 && dlaczegoIndex < 0) {
    for (let index = verdictIndex + 1; index < lines.length; index += 1) {
      if (
        DISTRACTOR_RE.test(lines[index].trim()) ||
        TRAP_RE.test(lines[index].trim()) ||
        TAKEAWAY_RE.test(lines[index].trim()) ||
        isTableLine(lines[index])
      ) {
        break;
      }
      reasonLines.push(lines[index]);
      mark(index);
    }
  }

  const correctReason = reasonLines.join("\n").trim();
  if (correctReason.length > 900) {
    flags.push({
      code: "too_long",
      detail: `correctReason ${correctReason.length} znaków`,
    });
  }

  const distractors: Record<string, string> = {};
  const usedOptionIds = new Set<string>();
  const pendingUnmatched: { label: string; sentence: string; detail: string }[] =
    [];
  if (dlaczegoIndex >= 0) {
    for (let index = dlaczegoIndex + 1; index < lines.length; index += 1) {
      const trimmed = lines[index].trim();
      if (isBlank(trimmed)) {
        mark(index);
        continue;
      }
      const distMatch = trimmed.match(DISTRACTOR_RE);
      if (!distMatch) break;
      mark(index);
      const label = distMatch[1].trim();
      const sentence = distMatch[2].trim();
      const match = findBestOption(label, input.options);
      const numericOk = match?.via === "numeric";
      const similarOk =
        match?.via === "similarity" && match.score >= MATCH_THRESHOLD;
      if (!match || (!numericOk && !similarOk) || match.id === input.correct_option_id) {
        pendingUnmatched.push({ label, sentence, detail: label });
        continue;
      }
      if (usedOptionIds.has(match.id)) {
        pendingUnmatched.push({
          label,
          sentence,
          detail: `${label} (duplikat ${match.id})`,
        });
        continue;
      }
      usedOptionIds.add(match.id);
      distractors[match.id] = sentence;
    }
  }

  for (const item of pendingUnmatched) {
    const remaining = input.options.filter(
      (option) =>
        option.id !== input.correct_option_id && !usedOptionIds.has(option.id),
    );
    if (
      remaining.length !== 1 ||
      isNumericOptionList(remaining[0].text) ||
      isNumericOptionList(item.label)
    ) {
      flags.push({ code: "distractor_unmatched", detail: item.detail });
      continue;
    }
    const score = similarity(
      normalizeMatchText(item.label),
      normalizeMatchText(remaining[0].text),
    );
    if (score < ELIMINATION_THRESHOLD) {
      flags.push({ code: "distractor_unmatched", detail: item.detail });
      continue;
    }
    usedOptionIds.add(remaining[0].id);
    distractors[remaining[0].id] = item.sentence;
    flags.push({
      code: "distractor_matched_by_elimination",
      detail: `${item.label} → ${remaining[0].id} similarity=${score.toFixed(3)}`,
    });
  }

  const tableLines: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (consumed[index]) continue;
    if (!isTableLine(lines[index])) continue;
    let end = index;
    while (end < lines.length && isTableLine(lines[end])) {
      tableLines.push(lines[end].trim());
      mark(end);
      end += 1;
    }
    break;
  }

  let contrast: string[][] | undefined;
  if (tableLines.length > 0) {
    const parsed = parseContrastGfm(tableLines.join("\n"));
    if (parsed && parsed.length > 0) {
      const cols = Math.max(...parsed.map((row) => row.length));
      const tooBig = cols > 3 || parsed.length > 5;
      if (tooBig) {
        flags.push({
          code: "contrast_too_big",
          detail: `${parsed.length} wierszy × ${cols} kolumn`,
        });
      } else {
        contrast = parsed;
      }
    }
  }

  let trap: string | undefined;
  let takeaway: string | undefined;
  for (let index = 0; index < lines.length; index += 1) {
    if (consumed[index]) continue;
    const trimmed = lines[index].trim();
    if (isBlank(trimmed)) {
      mark(index);
      continue;
    }
    const trapMatch = trimmed.match(TRAP_RE);
    if (trapMatch) {
      trap = trapMatch[1].trim();
      mark(index);
      continue;
    }
    const takeawayMatch = trimmed.match(TAKEAWAY_RE);
    if (takeawayMatch) {
      const text = takeawayMatch[1].trim();
      if (text.length > 200) {
        flags.push({
          code: "takeaway_too_long",
          detail: `${text.length} znaków`,
        });
      } else {
        takeaway = text;
      }
      mark(index);
    }
  }

  const remainder: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (consumed[index]) continue;
    if (isBlank(lines[index])) continue;
    remainder.push(lines[index].trim());
  }
  if (remainder.length > 0) {
    flags.push({
      code: "unparsed_remainder",
      detail: remainder.join(" / "),
    });
  }

  const reject =
    flags.some((flag) => flag.code === "too_long") ||
    flags.some((flag) => flag.code === "unparsed_remainder") ||
    !correctReason;

  if (!correctReason && !flags.some((flag) => flag.code === "too_long")) {
    flags.push({
      code: "unparsed_remainder",
      detail: "brak correctReason",
    });
  }

  if (reject) {
    return {
      id: input.id,
      accepted: false,
      flags,
      verdictText,
      originalExplanation: input.explanation,
    };
  }

  const blocks: ExplanationBlocksV2 = {
    version: 2,
    correctReason,
  };
  if (takeaway) blocks.takeaway = takeaway;
  if (Object.keys(distractors).length > 0) blocks.distractors = distractors;
  if (trap) blocks.trap = trap;
  if (contrast) blocks.contrast = contrast;

  const refs = ["Standard 1.0 / legacy"];
  if (verdictText) refs.push(verdictText);

  return {
    id: input.id,
    accepted: true,
    flags,
    item: {
      id: input.id,
      source: "parser",
      blocks,
      refs,
    },
    verdictText,
    originalExplanation: input.explanation,
  };
}

export function summarizeParseResults(results: ParseResult[]) {
  const accepted = results.filter((row) => row.accepted);
  const rejected = results.filter((row) => !row.accepted);
  const full = accepted.filter(
    (row) => row.item?.blocks.takeaway && row.item.blocks.trap,
  );
  const withoutTakeaway = accepted.filter((row) => !row.item?.blocks.takeaway);
  const withoutTrap = accepted.filter((row) => !row.item?.blocks.trap);
  const flagCounts = new Map<ParseFlagCode, number>();
  const rejectReasons = new Map<string, number>();
  for (const row of results) {
    for (const flag of row.flags) {
      flagCounts.set(flag.code, (flagCounts.get(flag.code) ?? 0) + 1);
    }
    if (!row.accepted) {
      const reason = [...new Set(row.flags.map((flag) => flag.code))].join("+") || "unknown";
      rejectReasons.set(reason, (rejectReasons.get(reason) ?? 0) + 1);
    }
  }
  return {
    total: results.length,
    accepted: accepted.length,
    rejected: rejected.length,
    full: full.length,
    withoutTakeaway: withoutTakeaway.length,
    withoutTrap: withoutTrap.length,
    flagCounts,
    rejectReasons,
  };
}

export function formatParseReport(
  results: ParseResult[],
  extras?: {
    sectionInvariant?: {
      mechanism: string[];
      distractors: string[];
      trap: string[];
      takeaway: string[];
      contrast: string[];
    };
  },
): string {
  const summary = summarizeParseResults(results);
  const lines = [
    "# parse-standard-v1",
    "",
    `total: ${summary.total}`,
    `accepted: ${summary.accepted}`,
    `rejected: ${summary.rejected}`,
    `full (takeaway+trap): ${summary.full}`,
    `without takeaway: ${summary.withoutTakeaway}`,
    `without trap: ${summary.withoutTrap}`,
    "",
    "## flagi (zbiorczo)",
    "",
  ];
  const eliminationIds = results
    .filter((row) =>
      row.flags.some((flag) => flag.code === "distractor_matched_by_elimination"),
    )
    .map((row) => row.id);
  for (const code of [
    "verdict_mismatch",
    "too_long",
    "distractor_unmatched",
    "distractor_matched_by_elimination",
    "contrast_too_big",
    "takeaway_too_long",
    "unparsed_remainder",
  ] as const) {
    lines.push(`- ${code}: ${summary.flagCounts.get(code) ?? 0}`);
  }
  lines.push(
    "",
    `## elimination (odzyskane): ${eliminationIds.length}`,
    "",
  );
  if (eliminationIds.length === 0) {
    lines.push("- (brak)");
  } else {
    for (const id of eliminationIds) lines.push(`- ${id}`);
  }
  lines.push("", "## odrzucone (dlaczego)", "");
  if (summary.rejectReasons.size === 0) {
    lines.push("- (brak)");
  } else {
    for (const [reason, count] of [...summary.rejectReasons.entries()].sort()) {
      lines.push(`- ${reason}: ${count}`);
    }
  }

  const flagged = results.filter((row) => row.flags.length > 0);
  lines.push("", `## pierwsze 30 flag (z ${flagged.length} pozycji z flagą)`, "");
  for (const row of flagged.slice(0, 30)) {
    const codes = row.flags.map((flag) => `${flag.code}: ${flag.detail}`).join("; ");
    lines.push(`- ${row.id} ${row.accepted ? "wsad" : "odrzucone"} — ${codes}`);
  }

  if (extras?.sectionInvariant) {
    const sections = extras.sectionInvariant;
    lines.push("", "## inwariant per sekcja (różnice)", "");
    for (const [name, ids] of [
      ["a) mechanizm / correctReason", sections.mechanism],
      ["b) dystraktory", sections.distractors],
      ["c) trap", sections.trap],
      ["d) takeaway", sections.takeaway],
      ["e) contrast", sections.contrast],
    ] as const) {
      lines.push(`- ${name}: ${ids.length}`);
      for (const id of ids.slice(0, 10)) lines.push(`  - ${id}`);
    }
  }

  lines.push("", "## wszystkie pozycje z flagą", "");
  for (const row of flagged) {
    const codes = row.flags.map((flag) => `${flag.code}: ${flag.detail}`).join("; ");
    lines.push(`- ${row.id} ${row.accepted ? "wsad" : "odrzucone"} — ${codes}`);
  }
  lines.push("");
  return lines.join("\n");
}
