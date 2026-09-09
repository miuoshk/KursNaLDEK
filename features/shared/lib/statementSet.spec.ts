import assert from "node:assert/strict";
import test from "node:test";
import {
  computeStatementSetDiff,
  formatStatementNumbers,
  statementIdSetsEqual,
  statementSetConsistencyIssue,
  trueStatementIds,
  type StatementSetBlocks,
  type StatementSetItem,
} from "@/features/shared/lib/statementSet";
import {
  explanationBlocksValid,
  normalizeExplanationBlocks,
} from "@/features/shared/lib/explanationBlocks";

const STATEMENTS: StatementSetItem[] = [
  { id: "s1", number: 1, text: "Ściana przyśrodkowa ostatnia", isTrue: true, rationale: "Tak w sekwencji." },
  { id: "s2", number: 2, text: "Kostnienie przed drugim trymestrem", isTrue: false, rationale: "Za wcześnie.", correction: "Później." },
  { id: "s3", number: 3, text: "Blaszka podstawna PAS-dodatnia", isTrue: true, rationale: "Glikoproteiny BM." },
  { id: "s5", number: 5, text: "Dyneina w aksonemie 9+2", isTrue: true, rationale: "Ramiona dyneinowe." },
];

const BLOCKS: StatementSetBlocks = {
  questionType: "statement_set",
  statements: STATEMENTS,
  optionStatements: {
    a: ["s1", "s2", "s3"],
    b: ["s1", "s3", "s5"],
    c: ["s1", "s2", "s5"],
    d: ["s2", "s3", "s5"],
    e: ["s1", "s3"],
  },
};

const OPTIONS = [
  { id: "a", text: "1, 2 i 3" },
  { id: "b", text: "1, 3 i 5" },
  { id: "c", text: "1, 2 i 5" },
  { id: "d", text: "2, 3 i 5" },
  { id: "e", text: "1 i 3" },
];

const RAW_BLOCKS = {
  version: 2 as const,
  questionType: "statement_set" as const,
  takeaway: "Oceń każde stwierdzenie, potem złóż zestaw.",
  statements: STATEMENTS,
  optionStatements: BLOCKS.optionStatements,
};

test("różnice: podzbiór, nadzbiór i przestawienie", () => {
  assert.deepEqual(
    computeStatementSetDiff(["s1", "s2", "s3"], ["s1", "s3", "s5"]),
    { remove: ["s2"], add: ["s5"] },
  );
  assert.deepEqual(
    computeStatementSetDiff(["s1", "s3"], ["s1", "s3", "s5"]),
    { remove: [], add: ["s5"] },
  );
  assert.deepEqual(
    computeStatementSetDiff(["s1", "s3", "s5"], ["s1", "s3"]),
    { remove: ["s5"], add: [] },
  );
  assert.deepEqual(
    computeStatementSetDiff(["s3", "s1", "s5"], ["s1", "s3", "s5"]),
    { remove: [], add: [] },
  );
});

test("zbiory id są odporne na kolejność", () => {
  assert.equal(statementIdSetsEqual(["s5", "s1", "s3"], ["s1", "s3", "s5"]), true);
  assert.equal(statementIdSetsEqual(["s1", "s3"], ["s1", "s3", "s5"]), false);
});

test("kompletne dane wskazują dokładnie klucz B", () => {
  assert.deepEqual(trueStatementIds(STATEMENTS), ["s1", "s3", "s5"]);
  assert.equal(
    statementSetConsistencyIssue(BLOCKS, OPTIONS.map((o) => o.id), "b"),
    null,
  );
  assert.equal(formatStatementNumbers(STATEMENTS, ["s1", "s3", "s5"]), "1, 3, 5");
});

test("zduplikowane numery stwierdzeń są sprzeczne", () => {
  assert.equal(
    statementSetConsistencyIssue(
      {
        ...BLOCKS,
        statements: [
          { ...STATEMENTS[0]!, number: 1 },
          { ...STATEMENTS[1]!, number: 1 },
          STATEMENTS[2]!,
          STATEMENTS[3]!,
        ],
      },
      OPTIONS.map((option) => option.id),
      "b",
    ),
    "duplicate_number",
  );
});

test("sprzeczność klucza i brakujące identyfikatory odrzucają kontrakt", () => {
  assert.equal(
    statementSetConsistencyIssue(BLOCKS, OPTIONS.map((o) => o.id), "a"),
    "key_mismatch",
  );
  assert.equal(
    statementSetConsistencyIssue(
      { ...BLOCKS, optionStatements: { ...BLOCKS.optionStatements, a: ["s9"] } },
      OPTIONS.map((o) => o.id),
      "b",
    ),
    "unknown_statement",
  );
  assert.equal(
    normalizeExplanationBlocks(RAW_BLOCKS, {
      questionId: "q-set-key",
      optionIds: OPTIONS.map((o) => o.id),
      correctOptionId: "a",
    }),
    null,
  );
});

test("normalize przyjmuje zestaw zgodny z kluczem, odrzuca niepełny", () => {
  const ok = normalizeExplanationBlocks(RAW_BLOCKS, {
    questionId: "q-set-ok",
    optionIds: OPTIONS.map((o) => o.id),
    correctOptionId: "b",
  });
  assert.equal(ok?.questionType, "statement_set");
  assert.equal(explanationBlocksValid(RAW_BLOCKS, OPTIONS, "b"), true);
  assert.equal(explanationBlocksValid(RAW_BLOCKS, OPTIONS, "a"), false);

  assert.equal(
    normalizeExplanationBlocks(
      {
        version: 2,
        questionType: "statement_set",
        statements: STATEMENTS,
      },
      { optionIds: OPTIONS.map((o) => o.id), correctOptionId: "b" },
    ),
    null,
  );
});

test("numery stwierdzeń mogą być nieregularne i nie biorą się z liter opcji", () => {
  assert.equal(formatStatementNumbers(STATEMENTS, ["s1", "s3", "s5"]), "1, 3, 5");
  assert.equal(
    statementSetConsistencyIssue(BLOCKS, ["e", "d", "c", "b", "a"], "b"),
    null,
  );
});

test("nie odtwarza prawdy z prozy 1) — prawda", () => {
  const proseOnly = normalizeExplanationBlocks({
    version: 2,
    correctReason: "**1) Ściana — prawda.** Reszta kombinacji A–E.",
  });
  assert.equal(proseOnly?.questionType, undefined);
  assert.equal("statements" in (proseOnly ?? {}), false);
});
