import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { SummaryVariant } from "@/features/session/lib/summaryVariant";
import {
  SUMMARY_COMPARE_MIN_N,
  SUMMARY_GREAT_ACCURACY,
  SUMMARY_MICRO_MAX_N,
  SUMMARY_PERFECT_ACCURACY,
  SUMMARY_VERDICT_POOL_SIZE,
  SUMMARY_WEAK_ACCURACY,
  canComparePreviousSession,
  getSummaryVariant,
  isFirstSubjectSession,
  isSummaryLayer2Ready,
  pickVerdictIndex,
  pickVerdictMessageKeys,
  resolveSummaryFooterActions,
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

  it("good gdy 50–79% i n >= próg", () => {
    assert.equal(
      getSummaryVariant(
        session({ n: 10, accuracy: SUMMARY_WEAK_ACCURACY }),
      ),
      "good",
    );
    assert.equal(
      getSummaryVariant(
        session({ n: 10, accuracy: SUMMARY_GREAT_ACCURACY - 0.01 }),
      ),
      "good",
    );
  });

  it("great gdy 80–99% i n >= próg", () => {
    assert.equal(
      getSummaryVariant(
        session({ n: 10, accuracy: SUMMARY_GREAT_ACCURACY }),
      ),
      "great",
    );
    assert.equal(
      getSummaryVariant(
        session({ n: 10, accuracy: SUMMARY_PERFECT_ACCURACY - 0.01 }),
      ),
      "great",
    );
  });

  it("perfect gdy 100% i n >= próg", () => {
    assert.equal(
      getSummaryVariant(
        session({ n: SUMMARY_MICRO_MAX_N, accuracy: SUMMARY_PERFECT_ACCURACY }),
      ),
      "perfect",
    );
  });

  it("micro wygrywa z 100% przy n < progu", () => {
    assert.equal(
      getSummaryVariant(session({ n: 3, accuracy: 1 })),
      "micro",
    );
  });
});

describe("puli werdyktów w i18n", () => {
  it("wszystkie locale mają pełne pule nagłówków", () => {
    const locales = ["pl", "en", "uk", "ru"] as const;
    for (const locale of locales) {
      const raw = readFileSync(
        new URL(`../../../messages/${locale}.json`, import.meta.url),
        "utf8",
      );
      const messages = JSON.parse(raw) as { session: Record<string, string> };
      for (const variant of Object.keys(
        SUMMARY_VERDICT_POOL_SIZE,
      ) as SummaryVariant[]) {
        const n = SUMMARY_VERDICT_POOL_SIZE[variant];
        const cap = `${variant.charAt(0).toUpperCase()}${variant.slice(1)}`;
        for (let i = 1; i <= n; i += 1) {
          assert.equal(
            typeof messages.session[`summaryVerdict${cap}${i}Title`],
            "string",
            `${locale} ${variant} ${i} title`,
          );
          assert.equal(
            typeof messages.session[`summaryVerdict${cap}${i}Subtitle`],
            "string",
            `${locale} ${variant} ${i} subtitle`,
          );
        }
      }
    }
  });
});

describe("pickVerdictIndex", () => {
  it("ten sam sessionId daje ten sam indeks", () => {
    const id = "4eb8fd3c-30c6-4d6a-bead-a94ab71b7a7b";
    const a = pickVerdictIndex(id, SUMMARY_VERDICT_POOL_SIZE.good);
    const b = pickVerdictIndex(id, SUMMARY_VERDICT_POOL_SIZE.good);
    assert.equal(a, b);
    assert.equal(a >= 0 && a < SUMMARY_VERDICT_POOL_SIZE.good, true);
  });

  it("klucze i18n są 1-based w puli wariantu", () => {
    const keys = pickVerdictMessageKeys("session-stable", "weak");
    assert.match(keys.titleKey, /^summaryVerdictWeak[1-9]Title$/);
    assert.match(keys.subtitleKey, /^summaryVerdictWeak[1-9]Subtitle$/);
  });
});

describe("resolveSummaryFooterActions", () => {
  it("weak/good: utrwal primary, następna secondary", () => {
    assert.deepEqual(resolveSummaryFooterActions("weak", 5), {
      primary: "retry",
      secondary: "next",
    });
    assert.deepEqual(resolveSummaryFooterActions("good", 2), {
      primary: "retry",
      secondary: "next",
    });
  });

  it("great/perfect: następna primary, utrwal secondary znika przy 0", () => {
    assert.deepEqual(resolveSummaryFooterActions("great", 1), {
      primary: "next",
      secondary: "retry",
    });
    assert.deepEqual(resolveSummaryFooterActions("perfect", 0), {
      primary: "next",
      secondary: null,
    });
  });

  it("micro: dokończ primary, utrwal secondary znika przy 0", () => {
    assert.deepEqual(resolveSummaryFooterActions("micro", 2), {
      primary: "finish",
      secondary: "retry",
    });
    assert.deepEqual(resolveSummaryFooterActions("micro", 0), {
      primary: "finish",
      secondary: null,
    });
  });

  it("weak/good przy 0 błędnych nie pokazuje Utrwal 0", () => {
    assert.deepEqual(resolveSummaryFooterActions("good", 0), {
      primary: "next",
      secondary: null,
    });
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
