import assert from "node:assert/strict";
import test from "node:test";
import type { SessionQuestion } from "@/features/session/types";
import { selectFeedbackVariant } from "./adaptiveFeedback";

function question(
  overrides: Partial<NonNullable<SessionQuestion["antares"]>> = {},
): SessionQuestion {
  return {
    id: "q-1",
    topicId: "t-1",
    text: "Pytanie",
    options: [],
    correctOptionId: "a",
    explanation: "",
    explanationBlocks: null,
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

test("wybiera zwarty feedback dla szybkiej, stabilnej odpowiedzi", () => {
  assert.equal(
    selectFeedbackVariant({
      question: question(),
      isCorrect: true,
      timeSpentSeconds: 20,
    }),
    "concise",
  );
});

test("wybiera standardowy feedback dla wolnej odpowiedzi", () => {
  assert.equal(
    selectFeedbackVariant({
      question: question(),
      isCorrect: true,
      timeSpentSeconds: 40,
    }),
    "standard",
  );
});

test("błąd lub leech zawsze uruchamia remediację", () => {
  assert.equal(
    selectFeedbackVariant({
      question: question(),
      isCorrect: false,
      timeSpentSeconds: 10,
    }),
    "remedial",
  );
  assert.equal(
    selectFeedbackVariant({
      question: question({ isLeech: true }),
      isCorrect: true,
      timeSpentSeconds: 10,
    }),
    "remedial",
  );
});
