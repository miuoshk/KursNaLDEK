import assert from "node:assert/strict";
import test from "node:test";
import { calculateLearningValueScore } from "@/features/session/lib/antares/learningValueScore";

test("preferuje kartę o większym ryzyku zapomnienia", () => {
  const risky = calculateLearningValueScore({
    retrievability: 0.35,
    mastery: 0.5,
    averageTimeSeconds: 40,
  });
  const stable = calculateLearningValueScore({
    retrievability: 0.9,
    mastery: 0.5,
    averageTimeSeconds: 40,
  });
  assert.ok(risky > stable);
});

test("znaczenie egzaminacyjne i słabość zwiększają priorytet", () => {
  const examWeak = calculateLearningValueScore({
    retrievability: 0.6,
    mastery: 0.2,
    averageTimeSeconds: 40,
    source: "cem",
    repeatCount: 3,
  });
  const ownStrong = calculateLearningValueScore({
    retrievability: 0.6,
    mastery: 0.9,
    averageTimeSeconds: 40,
    source: "own",
  });
  assert.ok(examWeak > ownStrong);
});

test("uwzględnia koszt czasu pytania", () => {
  const fast = calculateLearningValueScore({
    retrievability: 0.5,
    mastery: 0.5,
    averageTimeSeconds: 25,
  });
  const slow = calculateLearningValueScore({
    retrievability: 0.5,
    mastery: 0.5,
    averageTimeSeconds: 100,
  });
  assert.ok(fast > slow);
});

test("zapisane pojęcie daje ograniczony priorytet, nie zastępuje pilności FSRS", () => {
  const bookmarkedConcept = calculateLearningValueScore({
    retrievability: 0.7,
    mastery: 0.5,
    averageTimeSeconds: 40,
    conceptPrioritySignal: 1,
  });
  const noSignal = calculateLearningValueScore({
    retrievability: 0.7,
    mastery: 0.5,
    averageTimeSeconds: 40,
  });
  const actuallyDue = calculateLearningValueScore({
    retrievability: 0.3,
    mastery: 0.5,
    averageTimeSeconds: 40,
  });

  assert.ok(bookmarkedConcept > noSignal);
  assert.ok(bookmarkedConcept < actuallyDue);
});
