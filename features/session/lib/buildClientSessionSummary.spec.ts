import assert from "node:assert/strict";
import test from "node:test";
import { buildClientSessionSummary } from "./buildClientSessionSummary";
import type { SessionQuestion } from "@/features/session/types";

function question(
  id: string,
  extras: Partial<SessionQuestion> = {},
): SessionQuestion {
  return {
    id,
    text: id,
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
    ],
    correctOptionId: "a",
    explanation: "",
    sourceCode: null,
    topicName: "Temat",
    ...extras,
  };
}

test("natychmiastowe podsumowanie zbiera pojęcia z pytań", () => {
  const summary = buildClientSessionSummary({
    sessionId: "s",
    subjectId: "sub",
    subjectName: "Chirurgia",
    subjectShortName: "CHS",
    mode: "przeglad",
    questions: [
      question("q1", {
        concepts: [{ id: "c1", label: "prehabilitacja" }],
      }),
      question("q2", {
        concepts: [{ id: "c1", label: "prehabilitacja" }],
      }),
    ],
    answers: [
      {
        questionId: "q1",
        selectedOptionId: "b",
        isCorrect: false,
        confidence: null,
        timeSpentSeconds: 8,
      },
      {
        questionId: "q2",
        selectedOptionId: "a",
        isCorrect: true,
        confidence: null,
        timeSpentSeconds: 6,
      },
    ],
    profileXp: 0,
    profileStreak: 1,
  });

  assert.deepEqual(summary.strengthenedConcepts, [
    {
      conceptId: "c1",
      label: "prehabilitacja",
      attempts: 2,
      correct: 1,
      questionIds: ["q1", "q2"],
    },
  ]);
});
