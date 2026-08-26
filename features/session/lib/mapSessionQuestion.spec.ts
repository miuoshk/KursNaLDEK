import assert from "node:assert/strict";
import test from "node:test";
import {
  mapRowToSessionQuestion,
  type QuestionRow,
} from "@/features/session/lib/mapSessionQuestion";

function row(questionConcepts: QuestionRow["question_concepts"]): QuestionRow {
  return {
    id: "question",
    topic_id: "topic",
    text: "Treść",
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
    ],
    correct_option_id: "a",
    explanation: "Fallback",
    source_code: null,
    question_concepts: questionConcepts,
    topics: { name: "Temat", knowledge_card: "Karta" },
  };
}

test("transfer używa pojęcia głównego zamiast szerokiego fallbacku tematu", () => {
  const question = mapRowToSessionQuestion(
    row([
      { concept_id: "topic-concept", relation: "topic", weight: 0.35 },
      { concept_id: "specific-concept", relation: "primary", weight: 0.65 },
    ]),
  );

  assert.deepEqual(question.conceptIds, ["specific-concept"]);
});

test("pytanie bez pojęcia szczegółowego zachowuje bootstrap tematu", () => {
  const question = mapRowToSessionQuestion(
    row([{ concept_id: "topic-concept", relation: "primary", weight: 1 }]),
  );

  assert.deepEqual(question.conceptIds, ["topic-concept"]);
  assert.equal(question.knowledgeCard, "Karta");
});
