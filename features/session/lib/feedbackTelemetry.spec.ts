import assert from "node:assert/strict";
import test from "node:test";
import type { SessionQuestion } from "@/features/session/types";
import type { ExplanationBlocksV2 } from "@/features/shared/lib/explanationBlocks";
import {
  buildFeedbackShownEvent,
  classifyDistractorRecommendation,
  createFeedbackEventQueue,
  listFeedbackElements,
} from "@/features/session/lib/feedbackTelemetry";

const BLOCKS: ExplanationBlocksV2 = {
  version: 2,
  correctReason: "Mechanizm",
  takeaway: "Zasada",
  trap: "Pułapka",
  distractors: { b: "dlaczego b", c: "dlaczego c" },
};

function question(blocks: ExplanationBlocksV2 | null): SessionQuestion {
  return {
    id: "q1",
    topicId: "t1",
    text: "Pytanie",
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
    ],
    correctOptionId: "a",
    explanation: "proza",
    explanationBlocks: blocks,
    sourceCode: null,
    topicName: "Temat",
  };
}

test("concise z blokami: takeaway + full, bez od razu otwartego werdyktu w elements poza verdict", () => {
  const elements = listFeedbackElements({
    question: question(BLOCKS),
    selectedOptionId: "a",
    isCorrect: true,
    variant: "concise",
  });
  assert.deepEqual(elements, [
    "verdict",
    "takeaway",
    "full",
    "trap",
  ]);
});

test("standard + pewny błąd: hypercorrection i distractors", () => {
  const elements = listFeedbackElements({
    question: question(BLOCKS),
    selectedOptionId: "b",
    isCorrect: false,
    variant: "standard",
    confidence: "na_pewno",
  });
  assert.ok(elements.includes("hypercorrection"));
  assert.ok(elements.includes("correctReason"));
  assert.ok(elements.includes("distractors"));
});

test("bez bloków: legacy, nie takeaway", () => {
  const elements = listFeedbackElements({
    question: question(null),
    selectedOptionId: "a",
    isCorrect: true,
    variant: "standard",
  });
  assert.deepEqual(elements, ["verdict", "legacy"]);
});

test("queue: shown raz na pytanie, expand wiele razy, drain opróżnia", () => {
  const q = createFeedbackEventQueue();
  const shown = buildFeedbackShownEvent("q1", {
    question: question(BLOCKS),
    selectedOptionId: "a",
    isCorrect: true,
    variant: "concise",
  });
  q.recordShown(shown);
  q.recordShown(shown);
  q.recordExpand("q1", "full");
  q.recordExpand("q1", "distractors");
  const first = q.drain();
  assert.equal(first.length, 3);
  assert.equal(first[0]?.eventType, "feedback_shown");
  assert.equal(first[1]?.eventType, "feedback_expand");
  assert.equal(
    first[1]?.eventType === "feedback_expand" ? first[1].payload.section : null,
    "full",
  );
  assert.equal(q.drain().length, 0);
});

test("progi fabryki: ≥15 pisz, 3–15 opcjonalnie, <3 martwy, klucz osobno", () => {
  assert.equal(classifyDistractorRecommendation(15, false), "pisz");
  assert.equal(classifyDistractorRecommendation(14.9, false), "opcjonalnie");
  assert.equal(classifyDistractorRecommendation(3, false), "opcjonalnie");
  assert.equal(classifyDistractorRecommendation(2.9, false), "martwy dystraktor");
  assert.equal(classifyDistractorRecommendation(80, true), "klucz");
});
