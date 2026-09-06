import assert from "node:assert/strict";
import test from "node:test";
import type { Confidence, SessionQuestion } from "@/features/session/types";
import type { ExplanationBlocksV2 } from "@/features/shared/lib/explanationBlocks";
import {
  resolveExperimentFeedbackVariant,
  selectFeedbackVariant,
  type FeedbackVariantInput,
} from "./adaptiveFeedback";

const BLOCKS: ExplanationBlocksV2 = {
  version: 2,
  correctReason: "Mechanizm działania.",
  takeaway: "Zasada do zapamiętania.",
};

function question(
  overrides: Partial<NonNullable<SessionQuestion["antares"]>> = {},
  blocks: ExplanationBlocksV2 | null = null,
): SessionQuestion {
  return {
    id: "q-1",
    topicId: "t-1",
    text: "Pytanie",
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
    ],
    correctOptionId: "a",
    explanation: "",
    explanationBlocks: blocks,
    conceptIds: [],
    sourceCode: null,
    imageUrl: null,
    topicName: "Temat",
    disableOptionShuffle: false,
    antares: {
      isNew: false,
      retrievability: 0.9,
      fsrsDifficulty: 5,
      isLeech: false,
      priorAccuracy: 0.9,
      avgTimeSeconds: 30,
      topicMastery: 0.8,
      ...overrides,
    },
  };
}

function questionWithoutAntares(): SessionQuestion {
  const { antares: _dropped, ...rest } = question();
  return rest;
}

function select(
  overrides: Partial<FeedbackVariantInput> &
    Pick<FeedbackVariantInput, "isCorrect">,
) {
  return selectFeedbackVariant({
    question: question(),
    timeSpentSeconds: 20,
    confidence: null,
    hasTakeaway: true,
    ...overrides,
  });
}

const CONFIDENCES: Array<Confidence | null> = [
  "na_pewno",
  "troche",
  "nie_wiedzialem",
  null,
];

test("wybiera zwarty feedback dla szybkiej, stabilnej odpowiedzi (proxy przeglądu)", () => {
  assert.deepEqual(
    select({
      isCorrect: true,
      timeSpentSeconds: 20,
      confidence: null,
      hasTakeaway: true,
    }),
    { variant: "concise", hypercorrection: false },
  );
});

test("poprawne + na_pewno + takeaway → concise nawet gdy wolno", () => {
  assert.deepEqual(
    select({
      isCorrect: true,
      timeSpentSeconds: 90,
      confidence: "na_pewno",
      hasTakeaway: true,
    }),
    { variant: "concise", hypercorrection: false },
  );
});

test("poprawne + na_pewno bez takeaway → standard", () => {
  assert.deepEqual(
    select({
      isCorrect: true,
      timeSpentSeconds: 10,
      confidence: "na_pewno",
      hasTakeaway: false,
    }),
    { variant: "standard", hypercorrection: false },
  );
});

test("wybiera standardowy feedback dla wolnej odpowiedzi bez pewności", () => {
  assert.deepEqual(
    select({
      isCorrect: true,
      timeSpentSeconds: 40,
      confidence: null,
    }),
    { variant: "standard", hypercorrection: false },
  );
});

test("błąd lub leech zawsze uruchamia remediację", () => {
  assert.deepEqual(select({ isCorrect: false, timeSpentSeconds: 10 }), {
    variant: "remedial",
    hypercorrection: false,
  });
  assert.deepEqual(
    select({
      question: question({ isLeech: true }),
      isCorrect: true,
      timeSpentSeconds: 10,
      confidence: "na_pewno",
      hasTakeaway: true,
    }),
    { variant: "remedial", hypercorrection: false },
  );
});

test("błąd + na_pewno → remedial z hypercorrection", () => {
  assert.deepEqual(
    select({
      isCorrect: false,
      confidence: "na_pewno",
    }),
    { variant: "remedial", hypercorrection: true },
  );
});

test("progi stabilności 0.8 i 0.75 są włącznie", () => {
  assert.equal(
    select({
      question: question({ retrievability: 0.8, priorAccuracy: 0.75 }),
      isCorrect: true,
      timeSpentSeconds: 20,
      confidence: null,
      hasTakeaway: true,
    }).variant,
    "concise",
  );
  assert.equal(
    select({
      question: question({ retrievability: 0.799, priorAccuracy: 0.75 }),
      isCorrect: true,
      timeSpentSeconds: 20,
      confidence: null,
      hasTakeaway: true,
    }).variant,
    "standard",
  );
  assert.equal(
    select({
      question: question({ retrievability: 0.8, priorAccuracy: 0.749 }),
      isCorrect: true,
      timeSpentSeconds: 20,
      confidence: null,
      hasTakeaway: true,
    }).variant,
    "standard",
  );
});

test("brak antares: nie-stable, próg szybkości 25 s", () => {
  const q = questionWithoutAntares();
  assert.equal(
    select({
      question: q,
      isCorrect: true,
      timeSpentSeconds: 25,
      confidence: null,
      hasTakeaway: true,
    }).variant,
    "standard",
  );
  assert.equal(
    select({
      question: q,
      isCorrect: true,
      timeSpentSeconds: 25,
      confidence: "na_pewno",
      hasTakeaway: true,
    }).variant,
    "concise",
  );
  assert.equal(
    select({
      question: question({ avgTimeSeconds: null }),
      isCorrect: true,
      timeSpentSeconds: 25,
      confidence: null,
      hasTakeaway: true,
    }).variant,
    "concise",
  );
  assert.equal(
    select({
      question: question({ avgTimeSeconds: null }),
      isCorrect: true,
      timeSpentSeconds: 26,
      confidence: null,
      hasTakeaway: true,
    }).variant,
    "standard",
  );
});

test("treatment + brak bloków = standard, niezależnie od matrycy", () => {
  const withoutBlocks = question();
  assert.deepEqual(
    resolveExperimentFeedbackVariant({
      treatment: true,
      question: withoutBlocks,
      isCorrect: false,
      timeSpentSeconds: 8,
      confidence: "na_pewno",
    }),
    { variant: "standard", hypercorrection: true },
  );
  assert.equal(
    selectFeedbackVariant({
      question: withoutBlocks,
      isCorrect: false,
      timeSpentSeconds: 8,
      confidence: "na_pewno",
      hasTakeaway: false,
    }).variant,
    "remedial",
  );
});

test("treatment + bloki = wynik selectFeedbackVariant", () => {
  const withBlocks = question({}, BLOCKS);
  const input = {
    question: withBlocks,
    isCorrect: false,
    timeSpentSeconds: 8,
    confidence: "na_pewno" as const,
    hasTakeaway: true,
  };
  assert.deepEqual(
    resolveExperimentFeedbackVariant({
      treatment: true,
      question: withBlocks,
      isCorrect: false,
      timeSpentSeconds: 8,
      confidence: "na_pewno",
    }),
    selectFeedbackVariant(input),
  );
  assert.equal(selectFeedbackVariant(input).variant, "remedial");
  assert.deepEqual(
    resolveExperimentFeedbackVariant({
      treatment: true,
      question: withBlocks,
      isCorrect: true,
      timeSpentSeconds: 10,
      confidence: "na_pewno",
    }),
    selectFeedbackVariant({
      question: withBlocks,
      isCorrect: true,
      timeSpentSeconds: 10,
      confidence: "na_pewno",
      hasTakeaway: true,
    }),
  );
});

test("control + bloki = standard", () => {
  assert.equal(
    resolveExperimentFeedbackVariant({
      treatment: false,
      question: question({}, BLOCKS),
      isCorrect: false,
      timeSpentSeconds: 8,
      confidence: "na_pewno",
    }).variant,
    "standard",
  );
});

test("każdy wariant × każda pewność", () => {
  const expected: Record<
    "concise" | "standard" | "remedial",
    Record<string, { variant: string; hypercorrection: boolean }>
  > = {
    concise: {
      na_pewno: { variant: "concise", hypercorrection: false },
      troche: { variant: "standard", hypercorrection: false },
      nie_wiedzialem: { variant: "standard", hypercorrection: false },
      null: { variant: "concise", hypercorrection: false },
    },
    standard: {
      na_pewno: { variant: "concise", hypercorrection: false },
      troche: { variant: "standard", hypercorrection: false },
      nie_wiedzialem: { variant: "standard", hypercorrection: false },
      null: { variant: "standard", hypercorrection: false },
    },
    remedial: {
      na_pewno: { variant: "remedial", hypercorrection: true },
      troche: { variant: "remedial", hypercorrection: false },
      nie_wiedzialem: { variant: "remedial", hypercorrection: false },
      null: { variant: "remedial", hypercorrection: false },
    },
  };

  for (const confidence of CONFIDENCES) {
    const key = String(confidence);
    assert.deepEqual(
      select({
        isCorrect: true,
        timeSpentSeconds: 20,
        confidence,
        hasTakeaway: true,
      }),
      expected.concise[key],
      `concise-base × ${key}`,
    );
    assert.deepEqual(
      select({
        isCorrect: true,
        timeSpentSeconds: 40,
        confidence,
        hasTakeaway: true,
      }),
      expected.standard[key],
      `standard-base × ${key}`,
    );
    assert.deepEqual(
      select({
        isCorrect: false,
        timeSpentSeconds: 20,
        confidence,
        hasTakeaway: true,
      }),
      expected.remedial[key],
      `remedial × ${key}`,
    );
  }
});
