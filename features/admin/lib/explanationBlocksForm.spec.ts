import assert from "node:assert/strict";
import test from "node:test";
import { TEST_STATEMENT_SET_BLOCKS } from "@/features/session/fixtures/statementSetPreview";
import {
  buildSbaBlocks,
  buildStatementSetBlocks,
  explanationKindFromBlocks,
  optionStatementsFromBlocks,
  statementIdsUsedByOptions,
  statementsFromBlocks,
} from "@/features/admin/lib/explanationBlocksForm";

const OPTIONS = [
  { id: "a", text: "1, 2 i 3" },
  { id: "b", text: "1, 3 i 5" },
  { id: "c", text: "1, 2 i 5" },
  { id: "d", text: "2, 3 i 5" },
  { id: "e", text: "1 i 3" },
];

test("zapis bez zmian zachowuje statement_set", () => {
  assert.equal(explanationKindFromBlocks(TEST_STATEMENT_SET_BLOCKS), "statement_set");
  const drafts = statementsFromBlocks(TEST_STATEMENT_SET_BLOCKS);
  const mapped = optionStatementsFromBlocks(
    TEST_STATEMENT_SET_BLOCKS,
    OPTIONS.map((option) => option.id),
  );
  const rebuilt = buildStatementSetBlocks({
    takeaway: TEST_STATEMENT_SET_BLOCKS.takeaway ?? "",
    trap: TEST_STATEMENT_SET_BLOCKS.trap ?? "",
    contrastText: "",
    statements: drafts,
    optionStatements: mapped,
    options: OPTIONS,
  });
  assert.equal(rebuilt.questionType, "statement_set");
  assert.deepEqual(
    rebuilt.statements.map((row) => row.id),
    TEST_STATEMENT_SET_BLOCKS.statements.map((row) => row.id),
  );
  assert.deepEqual(rebuilt.optionStatements, TEST_STATEMENT_SET_BLOCKS.optionStatements);
});

test("usunięcie używanego stwierdzenia wymaga rozwiązania powiązań", () => {
  const used = statementIdsUsedByOptions(
    TEST_STATEMENT_SET_BLOCKS.optionStatements,
    "s2",
  );
  assert.deepEqual(used.sort(), ["a", "c", "d"]);
});

test("SBA emit nie dodaje statements", () => {
  const blocks = buildSbaBlocks({
    takeaway: "Zasada.",
    correctReason: "Mechanizm.",
    trap: "",
    distractors: { a: "Nie to." },
    contrastText: "",
    options: OPTIONS,
    correctOptionId: "b",
  });
  assert.equal("statements" in blocks, false);
  assert.equal(blocks.questionType, undefined);
});
