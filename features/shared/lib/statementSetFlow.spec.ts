import assert from "node:assert/strict";
import test from "node:test";
import { TEST_STATEMENT_SET_BLOCKS } from "@/features/session/fixtures/statementSetPreview";
import {
  buildStatementSetBlocks,
  optionStatementsFromBlocks,
  statementsFromBlocks,
} from "@/features/admin/lib/explanationBlocksForm";
import { mapRowToSessionQuestion } from "@/features/session/lib/mapSessionQuestion";
import { inspectExplanationBlocks } from "@/features/shared/lib/explanationBlocks";
import { renderExplanationBlocks } from "@/features/shared/lib/renderExplanationBlocks";
import { parseStatementSetV1 } from "../../../scripts/lib/parseStatementSetV1";

const OPTIONS = [
  { id: "a", text: "1, 2 i 3" },
  { id: "b", text: "1, 3 i 5" },
  { id: "c", text: "1, 2 i 5" },
  { id: "d", text: "2, 3 i 5" },
  { id: "e", text: "1 i 3" },
];

test("przepływ: import → walidacja → proza → odczyt → edytor", () => {
  const parsed = parseStatementSetV1({
    id: "ufo-test-set-001",
    options: OPTIONS,
    correct_option_id: "b",
    questionType: "statement_set",
    takeaway: TEST_STATEMENT_SET_BLOCKS.takeaway,
    trap: TEST_STATEMENT_SET_BLOCKS.trap,
    statements: TEST_STATEMENT_SET_BLOCKS.statements,
    optionStatements: TEST_STATEMENT_SET_BLOCKS.optionStatements,
  });
  assert.equal(parsed.accepted, true);
  const blocks = parsed.item!.blocks;

  const inspected = inspectExplanationBlocks(blocks, {
    questionId: "ufo-test-set-001",
    optionIds: OPTIONS.map((option) => option.id),
    correctOptionId: "b",
  });
  assert.equal(inspected.status, "statement_set");

  const prose = renderExplanationBlocks(blocks, OPTIONS, "b");
  assert.match(prose, /\*\*Stwierdzenia\*\*/);
  assert.doesNotMatch(prose, /Dlaczego nie pozostałe/);

  const question = mapRowToSessionQuestion({
    id: "ufo-test-set-001",
    text: "TEST UFO",
    options: OPTIONS,
    correct_option_id: "b",
    explanation: prose,
    explanation_blocks: blocks,
    source_code: "UFO-TEST-SET",
    topics: { name: "TEST UFO — zestawienie" },
  });
  assert.equal(question.explanationBlocksStatus, "statement_set");
  assert.equal(question.explanationBlocks?.questionType, "statement_set");

  const rebuilt = buildStatementSetBlocks({
    takeaway: blocks.takeaway ?? "",
    trap: blocks.trap ?? "",
    contrastText: "",
    statements: statementsFromBlocks(blocks),
    optionStatements: optionStatementsFromBlocks(
      blocks,
      OPTIONS.map((option) => option.id),
    ),
    options: OPTIONS,
  });
  assert.deepEqual(rebuilt.optionStatements, blocks.optionStatements);
});

test("przepływ: legacy, SBA, sprzeczny klucz, nieznany id, tasowanie", () => {
  const legacy = mapRowToSessionQuestion({
    id: "legacy-1",
    text: "Stare",
    options: OPTIONS,
    correct_option_id: "b",
    explanation: "Proza A–E",
    explanation_blocks: null,
    source_code: null,
    topics: { name: "Temat" },
  });
  assert.equal(legacy.explanationBlocksStatus, "none");
  assert.equal(legacy.explanation, "Proza A–E");

  const sba = inspectExplanationBlocks(
    { version: 2, correctReason: "Mechanizm." },
    { optionIds: OPTIONS.map((option) => option.id), correctOptionId: "b" },
  );
  assert.equal(sba.status, "sba");

  const unknown = inspectExplanationBlocks(
    {
      version: 2,
      questionType: "statement_set",
      statements: TEST_STATEMENT_SET_BLOCKS.statements,
      optionStatements: {
        ...TEST_STATEMENT_SET_BLOCKS.optionStatements,
        a: ["s9"],
      },
    },
    {
      questionId: "q-unknown",
      optionIds: OPTIONS.map((option) => option.id),
      correctOptionId: "b",
    },
  );
  assert.equal(unknown.status, "invalid");
  assert.equal(unknown.issue?.code, "unknown_statement");

  const shuffledIds = ["e", "d", "c", "b", "a"];
  const shuffled = inspectExplanationBlocks(TEST_STATEMENT_SET_BLOCKS, {
    optionIds: shuffledIds,
    correctOptionId: "b",
  });
  assert.equal(shuffled.status, "statement_set");
});
