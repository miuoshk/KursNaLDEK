import {
  createEmptyCard,
  fsrs,
  Rating,
  State,
  type Card,
  type FSRSParameters,
  type Grade,
} from "ts-fsrs";
import type { Confidence } from "@/features/session/types";

export const LEGACY_SCHEDULER_VERSION = "legacy-v1/ts-fsrs-5.4.1";
export const MEMORY_SCHEDULER_VERSION = "memory-v2/ts-fsrs-5.4.1";

export type RatingSource = "explicit" | "observed";

export type ProgressCardInput = {
  stability: number;
  difficulty_rating: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: string;
  next_review: string | null;
  last_answered_at: string | null;
};

export type MemorySchedulerSettings = {
  requestRetention: number;
  maximumInterval: number;
  weights?: number[];
};

export type AttemptRating = {
  grade: Grade;
  source: RatingSource;
};

export type MemoryCardSnapshot = {
  state: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  due: string | null;
  lastReview: string | null;
  retrievability: number;
};

export type ScheduledMemoryReview = {
  rating: Grade;
  before: MemoryCardSnapshot;
  after: MemoryCardSnapshot;
  progress: ProgressCardInput;
};

export const DEFAULT_MEMORY_SETTINGS: MemorySchedulerSettings = {
  requestRetention: 0.9,
  maximumInterval: 3650,
};

function finiteOr(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeMemorySchedulerSettings(
  input?: Partial<MemorySchedulerSettings> | null,
): MemorySchedulerSettings {
  const weights =
    Array.isArray(input?.weights) &&
    input.weights.length === 21 &&
    input.weights.every((value) => Number.isFinite(value))
      ? [...input.weights]
      : undefined;

  return {
    requestRetention: clamp(
      finiteOr(
        input?.requestRetention,
        DEFAULT_MEMORY_SETTINGS.requestRetention,
      ),
      0.7,
      0.99,
    ),
    maximumInterval: Math.round(
      clamp(
        finiteOr(
          input?.maximumInterval,
          DEFAULT_MEMORY_SETTINGS.maximumInterval,
        ),
        1,
        36500,
      ),
    ),
    weights,
  };
}

function toFsrsParameters(
  settings: MemorySchedulerSettings,
): Partial<FSRSParameters> {
  return {
    request_retention: settings.requestRetention,
    maximum_interval: settings.maximumInterval,
    enable_fuzz: false,
    ...(settings.weights ? { w: settings.weights } : {}),
  };
}

export function createMemoryScheduler(
  settings: Partial<MemorySchedulerSettings> = DEFAULT_MEMORY_SETTINGS,
) {
  const normalized = normalizeMemorySchedulerSettings(settings);
  return fsrs(toFsrsParameters(normalized));
}

export function confidenceToRating(
  isCorrect: boolean,
  confidence: Confidence,
): Grade {
  if (!isCorrect) return Rating.Again;
  switch (confidence) {
    case "nie_wiedzialem":
      return Rating.Hard;
    case "troche":
      return Rating.Good;
    case "na_pewno":
      return Rating.Easy;
  }
}

export function classifyAttemptRating(
  isCorrect: boolean,
  confidence: Confidence | null,
): AttemptRating {
  if (confidence == null) {
    return {
      grade: isCorrect ? Rating.Good : Rating.Again,
      source: "observed",
    };
  }
  return {
    grade: confidenceToRating(isCorrect, confidence),
    source: "explicit",
  };
}

export function ratingToLabel(
  grade: Grade,
): "Again" | "Hard" | "Good" | "Easy" {
  switch (grade) {
    case Rating.Again:
      return "Again";
    case Rating.Hard:
      return "Hard";
    case Rating.Easy:
      return "Easy";
    case Rating.Good:
    default:
      return "Good";
  }
}

export function stateFromString(value: string): State {
  switch (value) {
    case "learning":
      return State.Learning;
    case "review":
      return State.Review;
    case "relearning":
      return State.Relearning;
    case "new":
    default:
      return State.New;
  }
}

export function stateToString(value: State): string {
  switch (value) {
    case State.Learning:
      return "learning";
    case State.Review:
      return "review";
    case State.Relearning:
      return "relearning";
    case State.New:
    default:
      return "new";
  }
}

export function progressToCard(
  progress: ProgressCardInput | null,
  now: Date,
): Card {
  if (!progress) return createEmptyCard(now);
  return {
    due: progress.next_review ? new Date(progress.next_review) : now,
    stability: finiteOr(progress.stability, 0),
    difficulty: finiteOr(progress.difficulty_rating, 0.3),
    elapsed_days: finiteOr(progress.elapsed_days, 0),
    scheduled_days: finiteOr(progress.scheduled_days, 0),
    learning_steps: finiteOr(progress.learning_steps, 0),
    reps: finiteOr(progress.reps, 0),
    lapses: finiteOr(progress.lapses, 0),
    state: stateFromString(progress.state),
    last_review: progress.last_answered_at
      ? new Date(progress.last_answered_at)
      : undefined,
  };
}

function safeRetrievability(
  scheduler: ReturnType<typeof fsrs>,
  card: Card,
  now: Date,
): number {
  if (card.state === State.New || !card.last_review) return 0;
  try {
    const value = scheduler.get_retrievability(card, now, false);
    return Number.isFinite(value) ? clamp(value, 0, 1) : 0;
  } catch {
    return 0;
  }
}

function snapshot(
  scheduler: ReturnType<typeof fsrs>,
  card: Card,
  now: Date,
): MemoryCardSnapshot {
  return {
    state: stateToString(card.state),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    due: card.due.toISOString(),
    lastReview: card.last_review?.toISOString() ?? null,
    retrievability: safeRetrievability(scheduler, card, now),
  };
}

export function getProgressRetrievability(
  current: ProgressCardInput,
  now = new Date(),
  settings: Partial<MemorySchedulerSettings> = DEFAULT_MEMORY_SETTINGS,
): number {
  const scheduler = createMemoryScheduler(settings);
  return safeRetrievability(scheduler, progressToCard(current, now), now);
}

export function scheduleMemoryReview(
  current: ProgressCardInput | null,
  rating: Grade,
  now = new Date(),
  settings: Partial<MemorySchedulerSettings> = DEFAULT_MEMORY_SETTINGS,
): ScheduledMemoryReview {
  const scheduler = createMemoryScheduler(settings);
  const card = progressToCard(current, now);
  const before = snapshot(scheduler, card, now);
  const next = scheduler.next(card, now, rating).card;
  const after = snapshot(scheduler, next, now);

  return {
    rating,
    before,
    after,
    progress: {
      stability: next.stability,
      difficulty_rating: next.difficulty,
      elapsed_days: next.elapsed_days,
      scheduled_days: next.scheduled_days,
      learning_steps: next.learning_steps,
      reps: next.reps,
      lapses: next.lapses,
      state: stateToString(next.state),
      next_review: next.due.toISOString(),
      last_answered_at: now.toISOString(),
    },
  };
}
