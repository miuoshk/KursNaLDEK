import assert from "node:assert/strict";
import test from "node:test";
import { TEST_STATEMENT_SET_BLOCKS } from "../../features/session/fixtures/statementSetPreview";
import {
  isStructuredStatementSetInput,
  parseStatementSetV1,
} from "./parseStatementSetV1";

const OPTIONS = [
  { id: "a", text: "1, 2 i 3" },
  { id: "b", text: "1, 3 i 5" },
  { id: "c", text: "1, 2 i 5" },
  { id: "d", text: "2, 3 i 5" },
  { id: "e", text: "1 i 3" },
];

test("przyjmuje jawne zestawienie zgodne z kluczem", () => {
  const parsed = parseStatementSetV1({
    id: "ufo-test-set-001",
    options: OPTIONS,
    correct_option_id: "b",
    questionType: "statement_set",
    takeaway: TEST_STATEMENT_SET_BLOCKS.takeaway,
    statements: TEST_STATEMENT_SET_BLOCKS.statements,
    optionStatements: TEST_STATEMENT_SET_BLOCKS.optionStatements,
  });
  assert.equal(parsed.accepted, true);
  assert.equal(parsed.item?.blocks.questionType, "statement_set");
});

test("odrzuca prozę 1) — prawda i sprzeczny klucz z id pytania", () => {
  const prose = parseStatementSetV1({
    id: "q-prose",
    options: OPTIONS,
    correct_option_id: "b",
    explanation: "1) Koło ma jedną krawędź — prawda\n2) Trójkąt — fałsz",
  });
  assert.equal(prose.accepted, false);
  assert.equal(prose.flags[0]?.code, "prose_not_allowed");

  const mismatch = parseStatementSetV1({
    id: "q-key",
    options: OPTIONS,
    correct_option_id: "a",
    questionType: "statement_set",
    statements: TEST_STATEMENT_SET_BLOCKS.statements,
    optionStatements: TEST_STATEMENT_SET_BLOCKS.optionStatements,
  });
  assert.equal(mismatch.accepted, false);
  assert.equal(mismatch.flags[0]?.code, "key_mismatch");
  assert.match(mismatch.flags[0]?.detail ?? "", /q-key/);
});

test("wykrywa ustrukturyzowane wejście, nie zgaduje z prozy", () => {
  assert.equal(
    isStructuredStatementSetInput({
      id: "x",
      questionType: "statement_set",
      statements: [],
    }),
    true,
  );
  assert.equal(
    isStructuredStatementSetInput({
      id: "x",
      explanation: "1) coś — prawda",
      correct_option_id: "b",
    }),
    false,
  );
});
