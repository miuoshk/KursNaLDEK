import type { Confidence, SessionQuestion } from "@/features/session/types";

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
