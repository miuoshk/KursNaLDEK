import {
  createEmptyCard,
  fsrs,
  type Card,
  type Grade,
  Rating,
  State,
} from "ts-fsrs";
import type { Confidence } from "@/features/session/types";

const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 365,
});

export type ProgressCardInput = {
  stability: number;
  difficulty_rating: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: string;
  next_review: string | null;
  last_answered_at: string | null;
};

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
    default:
      return Rating.Good;
  }
}

function stateFromString(s: string): State {
  switch (s) {
    case "new":
      return State.New;
    case "learning":
      return State.Learning;
    case "review":
      return State.Review;
    case "relearning":
      return State.Relearning;
    default:
      return State.New;
  }
}

function stateToString(s: State): string {
  switch (s) {
    case State.New:
      return "new";
    case State.Learning:
      return "learning";
    case State.Review:
      return "review";
    case State.Relearning:
      return "relearning";
    default:
      return "new";
  }
}

function progressToCard(p: ProgressCardInput, now: Date): Card {
  return {
    due: p.next_review ? new Date(p.next_review) : now,
    stability: p.stability,
    difficulty: p.difficulty_rating,
    elapsed_days: p.elapsed_days,
    scheduled_days: p.scheduled_days,
    learning_steps: 0,
    reps: p.reps,
    lapses: p.lapses,
    state: stateFromString(p.state),
    last_review: p.last_answered_at ? new Date(p.last_answered_at) : undefined,
  };
}

export function calculateNextReview(
  current: ProgressCardInput | null,
  isCorrect: boolean,
  confidence: Confidence,
  now = new Date(),
) {
  const card: Card = current
    ? progressToCard(current, now)
    : createEmptyCard(now);
  const rating = confidenceToRating(isCorrect, confidence);
  const preview = scheduler.repeat(card, now);
  const scheduled = preview[rating];
  const c = scheduled.card;
  return {
    stability: c.stability,
    difficulty_rating: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    state: stateToString(c.state),
    next_review: c.due.toISOString(),
  };
}
