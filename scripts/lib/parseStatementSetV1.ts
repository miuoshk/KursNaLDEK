import {
  explanationBlocksIssueMessage,
  inspectExplanationBlocks,
  type ExplanationBlocksIssue,
  type ExplanationBlocksStatementSet,
} from "../../features/shared/lib/explanationBlocks";

export type StatementSetParseInput = {
  id: string;
  options: readonly { id: string; text: string }[];
  correct_option_id: string;
  questionType?: string;
  takeaway?: string;
  trap?: string;
  contrast?: string[][];
  statements?: unknown;
  optionStatements?: unknown;
  blocks?: unknown;
  explanation?: string;
};

export type StatementSetParseFlag = {
  code: ExplanationBlocksIssue["code"] | "prose_not_allowed";
  detail: string;
};

export type StatementSetParseResult = {
  id: string;
  accepted: boolean;
  flags: StatementSetParseFlag[];
  item?: {
    id: string;
    source: "parser";
    blocks: ExplanationBlocksStatementSet;
    refs: string[];
  };
};

export function isStructuredStatementSetInput(
  input: unknown,
): input is StatementSetParseInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const row = input as Record<string, unknown>;
  if (row.questionType === "statement_set") return true;
  if (Array.isArray(row.statements)) return true;
  if (row.optionStatements && typeof row.optionStatements === "object") {
    return true;
  }
  if (row.blocks && typeof row.blocks === "object" && !Array.isArray(row.blocks)) {
    const blocks = row.blocks as Record<string, unknown>;
    return (
      blocks.questionType === "statement_set" ||
      Array.isArray(blocks.statements) ||
      (blocks.optionStatements != null &&
        typeof blocks.optionStatements === "object")
    );
  }
  return false;
}

export function parseStatementSetV1(
  input: StatementSetParseInput,
): StatementSetParseResult {
  if (
    (!input.statements || !input.optionStatements) &&
    !input.blocks &&
    typeof input.explanation === "string" &&
    /—\s*prawda/i.test(input.explanation)
  ) {
    return {
      id: input.id,
      accepted: false,
      flags: [
        {
          code: "prose_not_allowed",
          detail:
            "nie odtwarzam prawda/fałsz z prozy; podaj statements i optionStatements",
        },
      ],
    };
  }

  const rawBlocks =
    input.blocks && typeof input.blocks === "object"
      ? input.blocks
      : {
          version: 2,
          questionType: "statement_set",
          takeaway: input.takeaway,
          trap: input.trap,
          contrast: input.contrast,
          statements: input.statements,
          optionStatements: input.optionStatements,
        };

  const inspected = inspectExplanationBlocks(rawBlocks, {
    questionId: input.id,
    optionIds: input.options.map((option) => option.id),
    correctOptionId: input.correct_option_id,
  });

  if (inspected.status !== "statement_set" || !inspected.blocks) {
    const issue = inspected.issue ?? {
      code: "schema" as const,
      detail: "incomplete statement_set",
    };
    return {
      id: input.id,
      accepted: false,
      flags: [
        {
          code: issue.code,
          detail: explanationBlocksIssueMessage(issue, input.id),
        },
      ],
    };
  }

  return {
    id: input.id,
    accepted: true,
    flags: [],
    item: {
      id: input.id,
      source: "parser",
      blocks: inspected.blocks,
      refs: ["statement-set-v1"],
    },
  };
}
