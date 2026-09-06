import type { Confidence, SessionQuestion } from "@/features/session/types";
import {
  normalizeExplanationBlocks,
  type NormalizeExplanationBlocksMeta,
} from "@/features/shared/lib/explanationBlocks";

export type FeedbackVariant = "concise" | "standard" | "remedial";

export type FeedbackVariantInput = {
  question: SessionQuestion;
  isCorrect: boolean;
  timeSpentSeconds: number;
  confidence: Confidence | null;
  hasTakeaway: boolean;
};

export type FeedbackVariantResult = {
  variant: FeedbackVariant;
  hypercorrection: boolean;
};

export function questionHasTakeaway(question: SessionQuestion): boolean {
  return Boolean(question.explanationBlocks?.takeaway?.trim());
}

export function hasNormalizedExplanationBlocks(
  blocks: unknown,
  meta?: NormalizeExplanationBlocksMeta,
): boolean {
  return normalizeExplanationBlocks(blocks, meta) != null;
}

export function questionHasNormalizedBlocks(
  question: Pick<
    SessionQuestion,
    "id" | "explanationBlocks" | "options" | "correctOptionId"
  >,
): boolean {
  return hasNormalizedExplanationBlocks(question.explanationBlocks, {
    questionId: question.id,
    optionIds: question.options.map((option) => option.id),
    correctOptionId: question.correctOptionId,
  });
}

/** Treatment adaptive-feedback-v1 only when normalized blocks exist. */
export function resolveExperimentFeedbackVariant(input: {
  treatment: boolean;
  question: SessionQuestion;
  isCorrect: boolean;
  timeSpentSeconds: number;
  confidence: Confidence | null;
}): FeedbackVariantResult {
  if (!input.treatment || !questionHasNormalizedBlocks(input.question)) {
    return {
      variant: "standard",
      hypercorrection: !input.isCorrect && input.confidence === "na_pewno",
    };
  }
  return selectFeedbackVariant({
    question: input.question,
    isCorrect: input.isCorrect,
    timeSpentSeconds: input.timeSpentSeconds,
    confidence: input.confidence,
    hasTakeaway: questionHasTakeaway(input.question),
  });
}

export function persistSessionFeedbackVariant(input: {
  treatment: boolean;
  question: SessionQuestion;
  isCorrect: boolean;
  timeSpentSeconds: number;
  confidence: Confidence | null;
  clientVariant?: FeedbackVariant;
}): FeedbackVariant {
  if (!input.treatment || !questionHasNormalizedBlocks(input.question)) {
    return "standard";
  }
  return (
    input.clientVariant ??
    resolveExperimentFeedbackVariant({
      treatment: true,
      question: input.question,
      isCorrect: input.isCorrect,
      timeSpentSeconds: input.timeSpentSeconds,
      confidence: input.confidence,
    }).variant
  );
}

export function selectFeedbackVariant(
  input: FeedbackVariantInput,
): FeedbackVariantResult {
  const meta = input.question.antares;
  const hypercorrection = !input.isCorrect && input.confidence === "na_pewno";

  if (!input.isCorrect || meta?.isLeech) {
    return { variant: "remedial", hypercorrection };
  }

  const personalFastThreshold =
    meta?.avgTimeSeconds != null
      ? Math.max(10, meta.avgTimeSeconds * 0.85)
      : 25;
  const stable =
    !meta?.isNew &&
    (meta?.retrievability ?? 0) >= 0.8 &&
    (meta?.priorAccuracy ?? 0) >= 0.75;
  const fast = input.timeSpentSeconds <= personalFastThreshold;
  const conciseByConfidence = input.confidence === "na_pewno";
  const conciseByPrzegladProxy =
    input.confidence === null && stable && fast;

  if (input.hasTakeaway && (conciseByConfidence || conciseByPrzegladProxy)) {
    return { variant: "concise", hypercorrection };
  }

  return { variant: "standard", hypercorrection };
}
