import type { SessionQuestion } from "@/features/session/types";

export type FeedbackVariant = "concise" | "standard" | "remedial";

export type FeedbackVariantInput = {
  question: SessionQuestion;
  isCorrect: boolean;
  timeSpentSeconds: number;
};

export function selectFeedbackVariant(
  input: FeedbackVariantInput,
): FeedbackVariant {
  const meta = input.question.antares;
  if (!input.isCorrect || meta?.isLeech) return "remedial";

  const personalFastThreshold =
    meta?.avgTimeSeconds != null
      ? Math.max(10, meta.avgTimeSeconds * 0.85)
      : 25;
  const stable =
    !meta?.isNew &&
    (meta?.retrievability ?? 0) >= 0.8 &&
    (meta?.priorAccuracy ?? 0) >= 0.75;

  return stable && input.timeSpentSeconds <= personalFastThreshold
    ? "concise"
    : "standard";
}
