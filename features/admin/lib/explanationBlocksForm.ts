import {
  isStatementSetBlocks,
  type ExplanationBlocksStatementSet,
  type ExplanationBlocksV2,
} from "@/features/shared/lib/explanationBlocks";
import { parseContrastGfm } from "@/features/shared/lib/explanationBlocks";

export type ExplanationKind = "sba" | "statement_set";

export type AdminStatementDraft = {
  id: string;
  number: string;
  text: string;
  isTrue: boolean;
  rationale: string;
  correction: string;
};

export function explanationKindFromBlocks(
  blocks: ExplanationBlocksV2 | null | undefined,
): ExplanationKind {
  return isStatementSetBlocks(blocks) ? "statement_set" : "sba";
}

export function nextStatementId(existing: readonly { id: string }[]): string {
  const used = new Set(existing.map((row) => row.id));
  for (let index = 1; index <= 20; index += 1) {
    const id = `s${index}`;
    if (!used.has(id)) return id;
  }
  return `s${existing.length + 1}`;
}

export function emptyStatementDraft(
  existing: readonly { id: string }[],
): AdminStatementDraft {
  const id = nextStatementId(existing);
  const match = /^s(\d+)$/.exec(id);
  return {
    id,
    number: match?.[1] ?? String(existing.length + 1),
    text: "",
    isTrue: false,
    rationale: "",
    correction: "",
  };
}

export function statementsFromBlocks(
  blocks: ExplanationBlocksV2 | null,
): AdminStatementDraft[] {
  if (!isStatementSetBlocks(blocks)) {
    return [emptyStatementDraft([]), emptyStatementDraft([{ id: "s1" }])];
  }
  return blocks.statements.map((statement, index) => ({
    id: statement.id,
    number: statement.number != null ? String(statement.number) : String(index + 1),
    text: statement.text,
    isTrue: statement.isTrue,
    rationale: statement.rationale,
    correction: statement.correction ?? "",
  }));
}

export function optionStatementsFromBlocks(
  blocks: ExplanationBlocksV2 | null,
  optionIds: readonly string[],
): Record<string, string[]> {
  const source = isStatementSetBlocks(blocks) ? blocks.optionStatements : {};
  const mapped: Record<string, string[]> = {};
  for (const optionId of optionIds) {
    mapped[optionId] = [...(source[optionId] ?? [])];
  }
  return mapped;
}

export function statementIdsUsedByOptions(
  optionStatements: Record<string, readonly string[]>,
  statementId: string,
): string[] {
  return Object.entries(optionStatements)
    .filter(([, ids]) => ids.includes(statementId))
    .map(([optionId]) => optionId);
}

export function buildSbaBlocks(input: {
  takeaway: string;
  correctReason: string;
  trap: string;
  distractors: Record<string, string>;
  contrastText: string;
  options: readonly { id: string }[];
  correctOptionId: string;
}): ExplanationBlocksV2 {
  const blocks: ExplanationBlocksV2 = {
    version: 2,
    correctReason: input.correctReason,
  };
  if (input.takeaway.trim()) blocks.takeaway = input.takeaway;
  if (input.trap.trim()) blocks.trap = input.trap;

  const nextDistractors: Record<string, string> = {};
  for (const option of input.options) {
    if (option.id === input.correctOptionId) continue;
    const reason = input.distractors[option.id] ?? "";
    if (reason.trim()) nextDistractors[option.id] = reason;
  }
  if (Object.keys(nextDistractors).length > 0) {
    blocks.distractors = nextDistractors;
  }

  const contrast = parseContrastGfm(input.contrastText);
  if (contrast) blocks.contrast = contrast;
  return blocks;
}

export function buildStatementSetBlocks(input: {
  takeaway: string;
  trap: string;
  contrastText: string;
  statements: readonly AdminStatementDraft[];
  optionStatements: Record<string, readonly string[]>;
  options: readonly { id: string }[];
}): ExplanationBlocksStatementSet {
  const statements = input.statements.map((statement) => {
    const number = Number.parseInt(statement.number, 10);
    const row: ExplanationBlocksStatementSet["statements"][number] = {
      id: statement.id.trim(),
      text: statement.text,
      isTrue: statement.isTrue,
      rationale: statement.rationale,
    };
    if (Number.isInteger(number) && number >= 1) row.number = number;
    if (!statement.isTrue && statement.correction.trim()) {
      row.correction = statement.correction;
    }
    return row;
  });

  const optionStatements: Record<string, string[]> = {};
  for (const option of input.options) {
    const ids = (input.optionStatements[option.id] ?? []).filter(Boolean);
    optionStatements[option.id] = ids;
  }

  const blocks: ExplanationBlocksStatementSet = {
    version: 2,
    questionType: "statement_set",
    statements,
    optionStatements,
  };
  if (input.takeaway.trim()) blocks.takeaway = input.takeaway;
  if (input.trap.trim()) blocks.trap = input.trap;
  const contrast = parseContrastGfm(input.contrastText);
  if (contrast) blocks.contrast = contrast;
  return blocks;
}
