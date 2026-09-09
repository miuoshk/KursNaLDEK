import { z } from "zod";
import {
  statementSetConsistencyIssue,
  type StatementSetBlocks,
} from "@/features/shared/lib/statementSet";

/** Limity identyczne z `public.explanation_blocks_valid` (KROK 1 + zestawienia). */
export const EXPLANATION_BLOCKS_LIMITS = {
  correctReason: 900,
  takeaway: 200,
  trap: 350,
  distractor: 350,
  contrastCell: 80,
  contrastRows: 5,
  contrastCols: 3,
  statementId: 40,
  statementText: 200,
  statementRationale: 350,
  statementCorrection: 200,
  statements: 8,
} as const;

const OPTION_LETTER_RE = /(odpowied[źz]|opcj[aięe]|wariant)\s*[A-F]\b/;
const HEADING_RE = /(^|\n)#{1,6}\s/;

export function explanationBlocksTextAllowed(text: string): boolean {
  if (OPTION_LETTER_RE.test(text)) return false;
  if (HEADING_RE.test(text)) return false;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp == null) continue;
    if ((cp >= 0x2600 && cp <= 0x27bf) || (cp >= 0x1f300 && cp <= 0x1faff)) {
      return false;
    }
  }
  return true;
}

function limitedText(max: number) {
  return z
    .string()
    .refine((value) => value.trim().length > 0, "empty")
    .refine((value) => value.length <= max, "too long")
    .refine(explanationBlocksTextAllowed, "forbidden content");
}

const contrastSchema = z
  .array(z.array(limitedText(EXPLANATION_BLOCKS_LIMITS.contrastCell)))
  .min(1)
  .max(EXPLANATION_BLOCKS_LIMITS.contrastRows)
  .refine(
    (rows) =>
      rows.every(
        (row) =>
          row.length >= 1 && row.length <= EXPLANATION_BLOCKS_LIMITS.contrastCols,
      ),
    "contrast shape",
  );

export const explanationBlocksSbaSchema = z.strictObject({
  version: z.literal(2),
  questionType: z.literal("single_best_answer").optional(),
  correctReason: limitedText(EXPLANATION_BLOCKS_LIMITS.correctReason),
  takeaway: limitedText(EXPLANATION_BLOCKS_LIMITS.takeaway).optional(),
  distractors: z
    .record(z.string(), limitedText(EXPLANATION_BLOCKS_LIMITS.distractor))
    .optional(),
  trap: limitedText(EXPLANATION_BLOCKS_LIMITS.trap).optional(),
  contrast: contrastSchema.optional(),
});

const statementIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(EXPLANATION_BLOCKS_LIMITS.statementId)
  .regex(/^[a-z0-9][a-z0-9_-]*$/i, "statement id");

export const explanationStatementSchema = z
  .strictObject({
    id: statementIdSchema,
    number: z.number().int().min(1).max(20).optional(),
    text: limitedText(EXPLANATION_BLOCKS_LIMITS.statementText),
    isTrue: z.boolean(),
    rationale: limitedText(EXPLANATION_BLOCKS_LIMITS.statementRationale),
    correction: limitedText(EXPLANATION_BLOCKS_LIMITS.statementCorrection).optional(),
  })
  .superRefine((statement, ctx) => {
    if (statement.isTrue && statement.correction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correction"],
        message: "true statement cannot have correction",
      });
    }
  });

export const explanationBlocksStatementSetSchema = z
  .strictObject({
    version: z.literal(2),
    questionType: z.literal("statement_set"),
    takeaway: limitedText(EXPLANATION_BLOCKS_LIMITS.takeaway).optional(),
    correctReason: limitedText(EXPLANATION_BLOCKS_LIMITS.correctReason).optional(),
    statements: z
      .array(explanationStatementSchema)
      .min(2)
      .max(EXPLANATION_BLOCKS_LIMITS.statements),
    optionStatements: z.record(z.string(), z.array(statementIdSchema).min(1)),
    trap: limitedText(EXPLANATION_BLOCKS_LIMITS.trap).optional(),
    contrast: contrastSchema.optional(),
  })
  .superRefine((blocks, ctx) => {
    const numbers = blocks.statements
      .map((statement) => statement.number)
      .filter((value): value is number => value != null);
    if (new Set(numbers).size !== numbers.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["statements"],
        message: "duplicate_number",
      });
    }
  });

export const explanationBlocksSchema = z.union([
  explanationBlocksSbaSchema,
  explanationBlocksStatementSetSchema,
]);

export type ExplanationBlocksSba = z.infer<typeof explanationBlocksSbaSchema>;
export type ExplanationBlocksStatementSet = z.infer<
  typeof explanationBlocksStatementSetSchema
>;
export type ExplanationBlocksV2 =
  | ExplanationBlocksSba
  | ExplanationBlocksStatementSet;

export function isStatementSetBlocks(
  blocks: ExplanationBlocksV2 | null | undefined,
): blocks is ExplanationBlocksStatementSet {
  return blocks?.questionType === "statement_set";
}

export type ExplanationBlocksStatus =
  | "none"
  | "legacy"
  | "sba"
  | "statement_set"
  | "invalid";

export type ExplanationBlocksIssueCode =
  | "not_an_object"
  | "schema"
  | "invalid_distractor_key"
  | "missing_option_mapping"
  | "unknown_option"
  | "unknown_statement"
  | "duplicate_statement"
  | "duplicate_number"
  | "empty_mapping"
  | "no_matching_option"
  | "multiple_matching_options"
  | "key_mismatch";

export type ExplanationBlocksIssue = {
  code: ExplanationBlocksIssueCode;
  detail: string;
};

export type ExplanationBlocksInspection =
  | { status: "none"; blocks: null; issue: null }
  | { status: "legacy"; blocks: null; issue: null }
  | { status: "sba"; blocks: ExplanationBlocksSba; issue: null }
  | {
      status: "statement_set";
      blocks: ExplanationBlocksStatementSet;
      issue: null;
    }
  | {
      status: "invalid";
      blocks: null;
      issue: ExplanationBlocksIssue;
      /** Oczyszczony szkic do redakcji — nigdy nie podawać studentowi. */
      draft?: ExplanationBlocksV2;
    };

export type NormalizeExplanationBlocksMeta = {
  questionId?: string;
  optionIds?: readonly string[];
  correctOptionId?: string;
};

export function explanationBlocksIssueMessage(
  issue: ExplanationBlocksIssue,
  questionId?: string,
): string {
  const prefix = questionId ? `${questionId}: ` : "";
  return `${prefix}${issue.code} — ${issue.detail}`;
}

function optionIdsFrom(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const id = (entry as { id?: unknown }).id;
    return typeof id === "string" ? [id] : [];
  });
}

function looksLikeStatementSet(input: Record<string, unknown>): boolean {
  return (
    input.questionType === "statement_set" ||
    Array.isArray(input.statements) ||
    (input.optionStatements != null &&
      typeof input.optionStatements === "object" &&
      !Array.isArray(input.optionStatements))
  );
}

function distractorKeysAllowed(
  blocks: ExplanationBlocksSba,
  optionIds: readonly string[],
  correctOptionId: string,
): boolean {
  if (!blocks.distractors) return true;
  return Object.keys(blocks.distractors).every(
    (key) => key !== correctOptionId && optionIds.includes(key),
  );
}

function statementSetKeysAllowed(
  blocks: ExplanationBlocksStatementSet,
  optionIds: readonly string[],
  correctOptionId: string,
): boolean {
  return (
    statementSetConsistencyIssue(
      blocks as StatementSetBlocks,
      optionIds,
      correctOptionId,
    ) == null
  );
}

/** Parity z `public.explanation_blocks_valid(blocks, options, correct_option_id)`. */
export function explanationBlocksValid(
  blocks: unknown,
  options: unknown,
  correctOptionId: string,
): boolean {
  const parsed = explanationBlocksSchema.safeParse(blocks);
  if (!parsed.success) return false;
  const optionIds = optionIdsFrom(options);
  if (parsed.data.questionType === "statement_set") {
    return statementSetKeysAllowed(parsed.data, optionIds, correctOptionId);
  }
  return distractorKeysAllowed(parsed.data, optionIds, correctOptionId);
}

function warnInvalidBlocks(
  questionId: string | undefined,
  issue: ExplanationBlocksIssue,
): void {
  console.warn(
    "[inspectExplanationBlocks] invalid blocks",
    questionId ?? "unknown",
    issue.code,
    issue.detail,
  );
}

function looksLikeAttemptedV2(input: Record<string, unknown>): boolean {
  return (
    input.version === 2 ||
    input.questionType === "single_best_answer" ||
    input.questionType === "statement_set" ||
    looksLikeStatementSet(input) ||
    typeof input.correctReason === "string" ||
    (input.distractors != null && typeof input.distractors === "object")
  );
}

function issueFromSchema(
  issues: readonly { path: (string | number)[]; message: string }[],
): ExplanationBlocksIssue {
  const first = issues[0];
  const path = first?.path?.length ? first.path.join(".") : "blocks";
  const message = first?.message ?? "invalid schema";
  if (message === "duplicate_number") {
    return { code: "duplicate_number", detail: path };
  }
  return { code: "schema", detail: `${path}: ${message}` };
}

function inspectNone(): ExplanationBlocksInspection {
  return { status: "none", blocks: null, issue: null };
}

function inspectLegacy(): ExplanationBlocksInspection {
  return { status: "legacy", blocks: null, issue: null };
}

function inspectInvalid(
  issue: ExplanationBlocksIssue,
  meta?: NormalizeExplanationBlocksMeta,
): ExplanationBlocksInspection {
  warnInvalidBlocks(meta?.questionId, issue);
  return { status: "invalid", blocks: null, issue };
}

export function inspectExplanationBlocks(
  value: unknown,
  meta?: NormalizeExplanationBlocksMeta,
): ExplanationBlocksInspection {
  if (value == null) return inspectNone();
  if (typeof value !== "object" || Array.isArray(value)) {
    return inspectInvalid(
      { code: "not_an_object", detail: "explanation_blocks is not an object" },
      meta,
    );
  }

  const input = value as Record<string, unknown>;
  if (looksLikeStatementSet(input)) {
    return inspectStatementSetBlocks(input, meta);
  }

  if (input.version === 1) return inspectLegacy();
  if (!looksLikeAttemptedV2(input)) return inspectLegacy();

  return inspectSbaBlocks(input, meta);
}

export function normalizeExplanationBlocks(
  value: unknown,
  meta?: NormalizeExplanationBlocksMeta,
): ExplanationBlocksV2 | null {
  const inspected = inspectExplanationBlocks(value, meta);
  return inspected.blocks;
}

function cleanOptionalText(
  value: unknown,
): string | unknown | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return value === undefined ? undefined : value;
}

function cleanContrast(value: unknown): unknown {
  if (!Array.isArray(value)) return undefined;
  return value.map((row) =>
    Array.isArray(row)
      ? row.map((cell) => (typeof cell === "string" ? cell.trim() : cell))
      : row,
  );
}

function inspectSbaBlocks(
  input: Record<string, unknown>,
  meta?: NormalizeExplanationBlocksMeta,
): ExplanationBlocksInspection {
  const cleaned: Record<string, unknown> = {};

  if ("version" in input) cleaned.version = input.version;
  if (input.questionType === "single_best_answer") {
    cleaned.questionType = input.questionType;
  }

  if (typeof input.correctReason === "string") {
    cleaned.correctReason = input.correctReason.trim();
  } else if (input.correctReason !== undefined) {
    cleaned.correctReason = input.correctReason;
  }

  const takeaway = cleanOptionalText(input.takeaway);
  if (takeaway !== undefined) cleaned.takeaway = takeaway;
  const trap = cleanOptionalText(input.trap);
  if (trap !== undefined) cleaned.trap = trap;

  if (
    input.distractors &&
    typeof input.distractors === "object" &&
    !Array.isArray(input.distractors)
  ) {
    const distractors: Record<string, string> = {};
    for (const [key, reason] of Object.entries(
      input.distractors as Record<string, unknown>,
    )) {
      if (typeof reason !== "string") continue;
      const text = reason.trim();
      if (text) distractors[key.toLowerCase()] = text;
    }
    if (Object.keys(distractors).length > 0) {
      cleaned.distractors = distractors;
    }
  }

  const contrast = cleanContrast(input.contrast);
  if (contrast !== undefined) cleaned.contrast = contrast;

  const parsed = explanationBlocksSbaSchema.safeParse(cleaned);
  if (!parsed.success) {
    return inspectInvalid(issueFromSchema(parsed.error.issues), meta);
  }

  if (meta?.optionIds && meta.correctOptionId) {
    if (
      !distractorKeysAllowed(
        parsed.data,
        meta.optionIds,
        meta.correctOptionId,
      )
    ) {
      const issue: ExplanationBlocksIssue = {
        code: "invalid_distractor_key",
        detail: "distractor key is the correct option or is not an option id",
      };
      warnInvalidBlocks(meta.questionId, issue);
      return {
        status: "invalid",
        blocks: null,
        issue,
        draft: parsed.data,
      };
    }
  }

  return { status: "sba", blocks: parsed.data, issue: null };
}

function inspectStatementSetBlocks(
  input: Record<string, unknown>,
  meta?: NormalizeExplanationBlocksMeta,
): ExplanationBlocksInspection {
  const cleaned: Record<string, unknown> = {
    version: input.version,
    questionType: "statement_set",
  };

  const takeaway = cleanOptionalText(input.takeaway);
  if (takeaway !== undefined) cleaned.takeaway = takeaway;
  const reason = cleanOptionalText(input.correctReason);
  if (reason !== undefined) cleaned.correctReason = reason;
  const trap = cleanOptionalText(input.trap);
  if (trap !== undefined) cleaned.trap = trap;

  if (Array.isArray(input.statements)) {
    cleaned.statements = input.statements.map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return entry;
      }
      const row = entry as Record<string, unknown>;
      const next: Record<string, unknown> = {
        id: typeof row.id === "string" ? row.id.trim() : row.id,
        text: typeof row.text === "string" ? row.text.trim() : row.text,
        isTrue: row.isTrue,
        rationale:
          typeof row.rationale === "string" ? row.rationale.trim() : row.rationale,
      };
      if (typeof row.number === "number") next.number = row.number;
      if (typeof row.correction === "string") {
        const correction = row.correction.trim();
        if (correction) next.correction = correction;
      } else if (row.correction !== undefined) {
        next.correction = row.correction;
      }
      return next;
    });
  }

  if (
    input.optionStatements &&
    typeof input.optionStatements === "object" &&
    !Array.isArray(input.optionStatements)
  ) {
    const mapped: Record<string, string[]> = {};
    for (const [key, ids] of Object.entries(
      input.optionStatements as Record<string, unknown>,
    )) {
      if (!Array.isArray(ids)) continue;
      mapped[key.toLowerCase()] = ids.flatMap((id) =>
        typeof id === "string" && id.trim() ? [id.trim()] : [],
      );
    }
    cleaned.optionStatements = mapped;
  }

  const contrast = cleanContrast(input.contrast);
  if (contrast !== undefined) cleaned.contrast = contrast;

  const parsed = explanationBlocksStatementSetSchema.safeParse(cleaned);
  if (!parsed.success) {
    return inspectInvalid(issueFromSchema(parsed.error.issues), meta);
  }

  if (meta?.optionIds && meta.correctOptionId) {
    const issue = statementSetConsistencyIssue(
      parsed.data,
      meta.optionIds,
      meta.correctOptionId,
    );
    if (issue) {
      warnInvalidBlocks(meta?.questionId, {
        code: issue,
        detail: `statement_set consistency failed: ${issue}`,
      });
      return {
        status: "invalid",
        blocks: null,
        issue: {
          code: issue,
          detail: `statement_set consistency failed: ${issue}`,
        },
        draft: parsed.data,
      };
    }
  }

  return { status: "statement_set", blocks: parsed.data, issue: null };
}

const GFM_SEPARATOR_RE = /^\|?[\s:|-]+$/;

export function parseContrastGfm(text: string): string[][] | undefined {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return undefined;

  const rows: string[][] = [];
  for (const line of lines) {
    if (GFM_SEPARATOR_RE.test(line) && line.includes("-")) continue;
    const parts = line.split("|").map((cell) => cell.trim());
    if (parts[0] === "") parts.shift();
    if (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();
    if (parts.length > 0) rows.push(parts);
  }
  return rows.length > 0 ? rows : undefined;
}

export function contrastToGfm(rows: string[][]): string {
  if (rows.length === 0) return "";
  const width = Math.max(...rows.map((row) => row.length), 1);
  const pad = (row: string[]) => {
    const cells = row.map((cell) => cell.trim());
    while (cells.length < width) cells.push("");
    return cells;
  };
  const fmt = (row: string[]) => `| ${pad(row).join(" | ")} |`;
  const sep = `| ${Array.from({ length: width }, () => "---").join(" | ")} |`;
  return [fmt(rows[0]), sep, ...rows.slice(1).map(fmt)].join("\n");
}

/** GFM table for `markdownBlock` in FeedbackPanel. */
export function contrastToMarkdown(rows: string[][]): string {
  return contrastToGfm(rows);
}
