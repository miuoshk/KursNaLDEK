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
  assert.deepEqual(question.concepts, [
    { id: "specific-concept", label: "specific-concept" },
  ]);
});

test("mapuje nazwę pojęcia z joinu concepts(name)", () => {
  const question = mapRowToSessionQuestion(
    row([
      {
        concept_id: "concept-1",
        relation: "primary",
        weight: 1,
        concepts: { name: "prehabilitacja" },
      },
    ]),
  );
  assert.deepEqual(question.concepts, [
    { id: "concept-1", label: "prehabilitacja" },
  ]);
});

test("sprzeczne bloki nie trafiają do studenta jako korekta", () => {
  const question = mapRowToSessionQuestion({
    id: "q-bad",
    text: "Treść",
    options: [
      { id: "a", text: "1" },
      { id: "b", text: "1 i 2" },
    ],
    correct_option_id: "a",
    explanation: "Proza z kombinacjami A–E",
    explanation_blocks: {
      version: 2,
      questionType: "statement_set",
      statements: [
        { id: "s1", text: "Pierwsze", isTrue: true, rationale: "Tak." },
        { id: "s2", text: "Drugie", isTrue: false, rationale: "Nie." },
      ],
      optionStatements: { a: ["s1", "s2"], b: ["s1"] },
    },
    source_code: null,
    topics: { name: "Temat" },
  });
  assert.equal(question.explanationBlocksStatus, "invalid");
  assert.equal(question.explanationBlocksIssue?.code, "key_mismatch");
  assert.equal(question.explanationBlocks, null);
});

test("pytanie bez pojęcia szczegółowego zachowuje bootstrap tematu", () => {
  const question = mapRowToSessionQuestion(
    row([{ concept_id: "topic-concept", relation: "primary", weight: 1 }]),
  );

  assert.deepEqual(question.conceptIds, ["topic-concept"]);
  assert.equal(question.knowledgeCard, "Karta");
});
