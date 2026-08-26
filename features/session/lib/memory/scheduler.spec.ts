import assert from "node:assert/strict";
import test from "node:test";
import { Rating } from "ts-fsrs";
import {
  classifyAttemptRating,
  getProgressRetrievability,
  normalizeMemorySchedulerSettings,
  scheduleMemoryReview,
} from "@/features/session/lib/memory/scheduler";

test("klasyfikuje próbę bez samooceny konserwatywnie", () => {
  assert.deepEqual(classifyAttemptRating(true, null), {
    grade: Rating.Good,
    source: "observed",
  });
  assert.deepEqual(classifyAttemptRating(false, null), {
    grade: Rating.Again,
    source: "observed",
  });
});

test("jawna pewność wpływa na rating tylko przy poprawnej odpowiedzi", () => {
  assert.equal(classifyAttemptRating(true, "na_pewno").grade, Rating.Easy);
  assert.equal(
    classifyAttemptRating(true, "nie_wiedzialem").grade,
    Rating.Hard,
  );
  assert.equal(classifyAttemptRating(false, "na_pewno").grade, Rating.Again);
});

test("scheduler jest deterministyczny przy wstrzykniętym zegarze", () => {
  const now = new Date("2026-08-25T00:00:00.000Z");
  const first = scheduleMemoryReview(null, Rating.Good, now, {
    requestRetention: 0.9,
    maximumInterval: 365,
  });
  const second = scheduleMemoryReview(null, Rating.Good, now, {
    requestRetention: 0.9,
    maximumInterval: 365,
  });

  assert.deepEqual(first, second);
  assert.equal(first.before.state, "new");
  assert.equal(first.after.reps, 1);
  assert.ok(first.after.due);
});

test("retrievability pozostaje w zakresie 0–1", () => {
  const value = getProgressRetrievability(
    {
      stability: 14,
      difficulty_rating: 5,
      elapsed_days: 7,
      scheduled_days: 14,
      learning_steps: 0,
      reps: 3,
      lapses: 0,
      state: "review",
      next_review: "2026-09-01T00:00:00.000Z",
      last_answered_at: "2026-08-18T00:00:00.000Z",
    },
    new Date("2026-08-25T00:00:00.000Z"),
  );

  assert.ok(value >= 0 && value <= 1);
});

test("odrzuca niepełny wektor wag zamiast wdrażać ciche wartości domyślne", () => {
  const settings = normalizeMemorySchedulerSettings({
    weights: Array.from({ length: 17 }, () => 1),
  });

  assert.equal(settings.weights, undefined);
});

test("zachowuje stan kroków learning przy odtwarzaniu karty", () => {
  const now = new Date("2026-08-25T00:10:00.000Z");
  const review = scheduleMemoryReview(
    {
      stability: 0.4,
      difficulty_rating: 5,
      elapsed_days: 0,
      scheduled_days: 0,
      learning_steps: 2,
      reps: 1,
      lapses: 0,
      state: "learning",
      next_review: "2026-08-25T00:10:00.000Z",
      last_answered_at: "2026-08-25T00:00:00.000Z",
    },
    Rating.Good,
    now,
  );

  assert.equal(review.before.learningSteps, 2);
});
