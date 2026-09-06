import { z } from "zod";

/** Limity identyczne z `public.explanation_blocks_valid` (KROK 1). */
export const EXPLANATION_BLOCKS_LIMITS = {
  correctReason: 900,
  takeaway: 200,
  trap: 350,
  distractor: 350,
  contrastCell: 80,
  contrastRows: 5,
  contrastCols: 3,
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

export const explanationBlocksSchema = z.strictObject({
  version: z.literal(2),
  correctReason: limitedText(EXPLANATION_BLOCKS_LIMITS.correctReason),
  takeaway: limitedText(EXPLANATION_BLOCKS_LIMITS.takeaway).optional(),
  distractors: z
    .record(z.string(), limitedText(EXPLANATION_BLOCKS_LIMITS.distractor))
    .optional(),
  trap: limitedText(EXPLANATION_BLOCKS_LIMITS.trap).optional(),
  contrast: contrastSchema.optional(),
});

export type ExplanationBlocksV2 = z.infer<typeof explanationBlocksSchema>;

export type NormalizeExplanationBlocksMeta = {
  questionId?: string;
  optionIds?: readonly string[];
  correctOptionId?: string;
};

function optionIdsFrom(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const id = (entry as { id?: unknown }).id;
    return typeof id === "string" ? [id] : [];
  });
}

function distractorKeysAllowed(
  blocks: ExplanationBlocksV2,
  optionIds: readonly string[],
  correctOptionId: string,
): boolean {
  if (!blocks.distractors) return true;
  return Object.keys(blocks.distractors).every(
    (key) => key !== correctOptionId && optionIds.includes(key),
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
  return distractorKeysAllowed(
    parsed.data,
    optionIdsFrom(options),
    correctOptionId,
  );
}

function warnInvalidBlocks(
  questionId: string | undefined,
  detail: unknown,
): void {
  console.warn(
    "[normalizeExplanationBlocks] invalid blocks",
    questionId ?? "unknown",
    detail,
  );
}

export function normalizeExplanationBlocks(
  value: unknown,
  meta?: NormalizeExplanationBlocksMeta,
): ExplanationBlocksV2 | null {
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    warnInvalidBlocks(meta?.questionId, "not an object");
    return null;
  }

  const input = value as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};

  if ("version" in input) cleaned.version = input.version;

  if (typeof input.correctReason === "string") {
    cleaned.correctReason = input.correctReason.trim();
  } else if (input.correctReason !== undefined) {
    cleaned.correctReason = input.correctReason;
  }

  if (typeof input.takeaway === "string") {
    const takeaway = input.takeaway.trim();
    if (takeaway) cleaned.takeaway = takeaway;
  } else if (input.takeaway !== undefined) {
    cleaned.takeaway = input.takeaway;
  }

  if (typeof input.trap === "string") {
    const trap = input.trap.trim();
    if (trap) cleaned.trap = trap;
  } else if (input.trap !== undefined) {
    cleaned.trap = input.trap;
  }

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

  if (Array.isArray(input.contrast)) {
    cleaned.contrast = input.contrast.map((row) =>
      Array.isArray(row)
        ? row.map((cell) => (typeof cell === "string" ? cell.trim() : cell))
        : row,
    );
  }

  const parsed = explanationBlocksSchema.safeParse(cleaned);
  if (!parsed.success) {
    warnInvalidBlocks(meta?.questionId, parsed.error.issues);
    return null;
  }

  if (meta?.optionIds && meta.correctOptionId) {
    if (
      !distractorKeysAllowed(
        parsed.data,
        meta.optionIds,
        meta.correctOptionId,
      )
    ) {
      warnInvalidBlocks(meta.questionId, "invalid distractor key");
      return null;
    }
  }

  return parsed.data;
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
