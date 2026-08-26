import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SUMMARY_COMPARE_MIN_N,
  SUMMARY_MICRO_MAX_N,
  SUMMARY_WEAK_ACCURACY,
  canComparePreviousSession,
  getSummaryVariant,
  isFirstSubjectSession,
  isSummaryLayer2Ready,
  splitSessionConcepts,
  summaryQuestionSnippet,
} from "@/features/session/lib/summaryVariant";

function session(overrides: {
  n: number;
  accuracy: number;
  previousAccuracy?: number | null;
  previousTotalQuestions?: number | null;
}) {
  return {
    answers: { length: overrides.n },
    accuracy: overrides.accuracy,
    previousAccuracy: overrides.previousAccuracy ?? null,
    previousTotalQuestions: overrides.previousTotalQuestions,
  };
}

describe("getSummaryVariant", () => {
  it("micro wygrywa z accuracy 0% przy n < progu", () => {
    assert.equal(
      getSummaryVariant(session({ n: SUMMARY_MICRO_MAX_N - 1, accuracy: 0 })),
      "micro",
    );
    assert.equal(
      getSummaryVariant(session({ n: 3, accuracy: 0 })),
      "micro",
    );
  });

  it("n równe progowi nie jest micro", () => {
    assert.equal(
      getSummaryVariant(
        session({ n: SUMMARY_MICRO_MAX_N, accuracy: 0 }),
      ),
      "weak",
    );
  });

  it("weak gdy n >= próg i accuracy < 50%", () => {
    assert.equal(
      getSummaryVariant(
        session({ n: 10, accuracy: SUMMARY_WEAK_ACCURACY - 0.01 }),
      ),
      "weak",
    );
  });

  it("good gdy accuracy >= 50% i n >= próg", () => {
    assert.equal(
      getSummaryVariant(
        session({ n: 10, accuracy: SUMMARY_WEAK_ACCURACY }),
      ),
      "good",
    );
    assert.equal(
      getSummaryVariant(session({ n: 5, accuracy: 1 })),
      "good",
    );
  });
});

describe("porównanie z poprzednią sesją", () => {
  it("L1 nie jest warstwą 2", () => {
    assert.equal(
      isSummaryLayer2Ready(session({ n: 10, accuracy: 0.4 })),
      false,
    );
  });

  it("pierwsza sesja z przedmiotu po L2", () => {
    assert.equal(
      isFirstSubjectSession(
        session({
          n: 10,
          accuracy: 0.2,
          previousAccuracy: null,
          previousTotalQuestions: null,
        }),
      ),
      true,
    );
    assert.equal(
      isFirstSubjectSession(session({ n: 10, accuracy: 0.2 })),
      false,
    );
  });

  it("compare tylko gdy obie sesje mają n >= 5", () => {
    assert.equal(
      canComparePreviousSession(
        session({
          n: 10,
          accuracy: 0.4,
          previousAccuracy: 0.7,
          previousTotalQuestions: SUMMARY_COMPARE_MIN_N,
        }),
      ),
      true,
    );
    assert.equal(
      canComparePreviousSession(
        session({
          n: 10,
          accuracy: 0.4,
          previousAccuracy: 0.7,
          previousTotalQuestions: SUMMARY_COMPARE_MIN_N - 1,
        }),
      ),
      false,
    );
    assert.equal(
      canComparePreviousSession(
        session({
          n: 4,
          accuracy: 0.8,
          previousAccuracy: 0.7,
          previousTotalQuestions: 10,
        }),
      ),
      false,
    );
  });
});

describe("splitSessionConcepts", () => {
  it("100% do opanowanych, reszta do powtórki od najgorszych", () => {
    const { mastered, review } = splitSessionConcepts([
      { conceptId: "a", label: "A", attempts: 3, correct: 3 },
      { conceptId: "b", label: "B", attempts: 3, correct: 0 },
      { conceptId: "c", label: "C", attempts: 2, correct: 1 },
    ]);
    assert.deepEqual(
      mastered.map((c) => c.conceptId),
      ["a"],
    );
    assert.deepEqual(
      review.map((c) => c.conceptId),
      ["b", "c"],
    );
  });
});

describe("summaryQuestionSnippet", () => {
  it("nie ucina krótkiego tekstu i dodaje wielokropek po limicie", () => {
    assert.equal(summaryQuestionSnippet("krótko"), "krótko");
    const long = "x".repeat(90);
    const snip = summaryQuestionSnippet(long, 80);
    assert.equal(snip.length, 80);
    assert.equal(snip.endsWith("…"), true);
  });
});
