import {
  isSbaBlocks,
  parseContrastGfm,
} from "../../features/shared/lib/explanationBlocks";
import type { ParseInput, ParseResult } from "./parseStandardV1";
import { stripEmojiForInvariant } from "./renderExplanationBlocks";

const VERDICT_RE = /^\*\*(?:✅\s*)?Poprawna odpowiedź:\*\*\s*(.+)$/;
const DLACZEGO_RE = /^\*\*Dlaczego nie pozostałe\?\*\*\s*$/;
const DISTRACTOR_RE = /^-\s*\*(.+?)\*\s+[—–-]\s+(.+)$/;
const TRAP_RE = /^>\s*(?:⚠️\s*)?\*\*Pułapka:\*\*\s*(.*)$/;
const TAKEAWAY_RE = /^>\s*(?:💡\s*)?\*\*(?:Haczyk|Zasada):\*\*\s*(.*)$/;
const TABLE_LINE_RE = /^\|.+\|$|^\|.+\|?$/;

export type SectionName =
  | "mechanism"
  | "distractors"
  | "trap"
  | "takeaway"
  | "contrast";

export type SectionDiff = {
  id: string;
  section: SectionName;
  detail: string;
};

function normalizeWs(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

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

function cleanLabeled(value: string): string {
  return normalizeWs(stripEmojiForInvariant(value));
}

export function extractLegacySections(explanation: string) {
  const lines = explanation.replace(/\r\n/g, "\n").split("\n");
  let verdictIndex = -1;
  let dlaczegoIndex = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (verdictIndex < 0 && VERDICT_RE.test(trimmed)) verdictIndex = index;
    if (dlaczegoIndex < 0 && DLACZEGO_RE.test(trimmed)) dlaczegoIndex = index;
  }

  const reasonLines: string[] = [];
  if (verdictIndex >= 0 && dlaczegoIndex > verdictIndex) {
    for (let index = verdictIndex + 1; index < dlaczegoIndex; index += 1) {
      if (isTableLine(lines[index])) continue;
      reasonLines.push(lines[index]);
    }
  }

  const distractors: { label: string; sentence: string }[] = [];
  if (dlaczegoIndex >= 0) {
    for (let index = dlaczegoIndex + 1; index < lines.length; index += 1) {
      const trimmed = lines[index].trim();
      if (isBlank(trimmed)) continue;
      const match = trimmed.match(DISTRACTOR_RE);
      if (!match) break;
      distractors.push({ label: match[1].trim(), sentence: match[2].trim() });
    }
  }

  let trap: string | null = null;
  let takeaway: string | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    const trapMatch = trimmed.match(TRAP_RE);
    if (trapMatch) trap = trapMatch[1].trim();
    const takeawayMatch = trimmed.match(TAKEAWAY_RE);
    if (takeawayMatch) takeaway = takeawayMatch[1].trim();
  }

  const tableLines: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!isTableLine(lines[index])) continue;
    let end = index;
    while (end < lines.length && isTableLine(lines[end])) {
      tableLines.push(lines[end].trim());
      end += 1;
    }
    break;
  }
  const contrast = tableLines.length > 0 ? parseContrastGfm(tableLines.join("\n")) : undefined;

  return {
    correctReason: reasonLines.join("\n").trim(),
    distractors,
    trap,
    takeaway,
    contrast,
  };
}

function multisetEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].map(normalizeWs).sort();
  const sortedRight = [...right].map(normalizeWs).sort();
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function cellsEqual(
  left: string[][] | undefined,
  right: string[][] | undefined,
): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  if (left.length !== right.length) return false;
  return left.every(
    (row, rowIndex) =>
      row.length === right[rowIndex].length &&
      row.every(
        (cell, col) => normalizeWs(cell) === normalizeWs(right[rowIndex][col]),
      ),
  );
}

function unmatchedLabels(result: ParseResult): Set<string> {
  const labels = new Set<string>();
  for (const flag of result.flags) {
    if (flag.code !== "distractor_unmatched") continue;
    const label = flag.detail.replace(/\s+\(duplikat .+\)$/, "");
    labels.add(label);
  }
  return labels;
}

export function diffSectionInvariants(
  input: ParseInput,
  result: ParseResult,
): SectionDiff[] {
  if (!result.accepted || !result.item) return [];
  const legacy = extractLegacySections(input.explanation ?? "");
  const blocks = result.item.blocks;
  if (!isSbaBlocks(blocks)) return [];
  const diffs: SectionDiff[] = [];

  if (normalizeWs(legacy.correctReason) !== normalizeWs(blocks.correctReason)) {
    diffs.push({
      id: result.id,
      section: "mechanism",
      detail: `legacy ${legacy.correctReason.length} vs blocks ${blocks.correctReason.length}`,
    });
  }

  const skipped = unmatchedLabels(result);
  const legacySentences = legacy.distractors
    .filter((item) => !skipped.has(item.label))
    .map((item) => item.sentence);
  const blockSentences = Object.values(blocks.distractors ?? {});
  if (!multisetEqual(legacySentences, blockSentences)) {
    diffs.push({
      id: result.id,
      section: "distractors",
      detail: `legacy ${legacySentences.length} vs blocks ${blockSentences.length}`,
    });
  }

  const legacyTrap = legacy.trap ? cleanLabeled(legacy.trap) : "";
  const blockTrap = blocks.trap ? cleanLabeled(blocks.trap) : "";
  if (legacyTrap !== blockTrap) {
    diffs.push({
      id: result.id,
      section: "trap",
      detail: `legacy="${legacyTrap}" blocks="${blockTrap}"`,
    });
  }

  const takeawayTooLong = result.flags.some((flag) => flag.code === "takeaway_too_long");
  const legacyTakeaway = legacy.takeaway ? cleanLabeled(legacy.takeaway) : "";
  const blockTakeaway = blocks.takeaway ? cleanLabeled(blocks.takeaway) : "";
  if (!takeawayTooLong && legacyTakeaway !== blockTakeaway) {
    diffs.push({
      id: result.id,
      section: "takeaway",
      detail: `legacy="${legacyTakeaway}" blocks="${blockTakeaway}"`,
    });
  }

  const contrastTooBig = result.flags.some((flag) => flag.code === "contrast_too_big");
  if (!contrastTooBig && !cellsEqual(legacy.contrast, blocks.contrast)) {
    diffs.push({
      id: result.id,
      section: "contrast",
      detail: `legacy ${legacy.contrast?.length ?? 0} vs blocks ${blocks.contrast?.length ?? 0}`,
    });
  }

  return diffs;
}

export function summarizeSectionDiffs(diffs: SectionDiff[]) {
  const empty = (): string[] => [];
  const out = {
    mechanism: empty(),
    distractors: empty(),
    trap: empty(),
    takeaway: empty(),
    contrast: empty(),
  };
  for (const diff of diffs) {
    out[diff.section].push(`${diff.id} — ${diff.detail}`);
  }
  return out;
}
