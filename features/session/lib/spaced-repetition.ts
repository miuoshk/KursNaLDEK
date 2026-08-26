import type { Grade } from "ts-fsrs";
import type { Confidence } from "@/features/session/types";
import {
  classifyAttemptRating,
  confidenceToRating,
  scheduleMemoryReview,
  type ProgressCardInput,
} from "@/features/session/lib/memory/scheduler";

const LEGACY_SETTINGS = {
  requestRetention: 0.9,
  maximumInterval: 365,
} as const;

export {
  classifyAttemptRating,
  confidenceToRating,
  type ProgressCardInput,
} from "@/features/session/lib/memory/scheduler";

export function calculateNextReview(
  current: ProgressCardInput | null,
  isCorrect: boolean,
  confidence: Confidence,
  now = new Date(),
) {
  const rating: Grade = confidenceToRating(isCorrect, confidence);
  return scheduleMemoryReview(current, rating, now, LEGACY_SETTINGS).progress;
}

export function calculateObservedNextReview(
  current: ProgressCardInput | null,
  isCorrect: boolean,
  confidence: Confidence | null,
  now = new Date(),
) {
  const rating = classifyAttemptRating(isCorrect, confidence);
  return {
    rating,
    scheduled: scheduleMemoryReview(
      current,
      rating.grade,
      now,
      LEGACY_SETTINGS,
    ),
  };
}
