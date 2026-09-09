import assert from "node:assert/strict";
import test from "node:test";
import {
  EXPLANATION_BLOCKS_LIMITS,
  contrastToGfm,
  contrastToMarkdown,
  explanationBlocksTextAllowed,
  explanationBlocksValid,
  inspectExplanationBlocks,
  normalizeExplanationBlocks,
  parseContrastGfm,
} from "@/features/shared/lib/explanationBlocks";

const OPTIONS = [
  { id: "a", text: "alfa" },
  { id: "b", text: "beta" },
  { id: "c", text: "gamma" },
  { id: "d", text: "delta" },
  { id: "e", text: "epsilon" },
] as const;

const CORRECT = "b";

const SQL_FIXTURES: {
  name: string;
  expected: boolean;
  blocks: unknown;
}[] = [
  {
    name: "01_full_valid",
    expected: true,
    blocks: {
      version: 2,
      correctReason: "Mechanizm poprawnej odpowiedzi w jednym akapicie.",
      takeaway: "Jedna zasada do odtworzenia.",
      distractors: {
        a: "Inny mechanizm, nie ten.",
        c: "Mylone z sąsiednim pojęciem.",
      },
      trap: "Łatwo pomylić z sąsiednim rozpoznaniem.",
      contrast: [
        ["cecha", "ostre", "przewlekłe"],
        ["czas", "dni", "miesiące"],
      ],
    },
  },
  {
    name: "02_minimal_correctReason_only",
    expected: true,
    blocks: { version: 2, correctReason: "Tylko mechanizm." },
  },
  {
    name: "03_missing_version",
    expected: false,
    blocks: { correctReason: "Mechanizm bez wersji." },
  },
  {
    name: "04_version_1",
    expected: false,
    blocks: { version: 1, correctReason: "Stary kształt bloków." },
  },
  {
    name: "05_empty_correctReason",
    expected: false,
    blocks: { version: 2, correctReason: "" },
  },
  {
    name: "06_takeaway_201",
    expected: false,
    blocks: {
      version: 2,
      correctReason: "Mechanizm.",
      takeaway: "x".repeat(201),
    },
  },
  {
    name: "07_distractor_is_correct_key",
    expected: false,
    blocks: {
      version: 2,
      correctReason: "Mechanizm.",
      distractors: { b: "To jest klucz, nie dystraktor." },
    },
  },
  {
    name: "08_distractor_outside_options",
    expected: false,
    blocks: {
      version: 2,
      correctReason: "Mechanizm.",
      distractors: { z: "Nie ma takiej opcji." },
    },
  },
  {
    name: "09_option_letter_in_text",
    expected: false,
    blocks: {
      version: 2,
      correctReason: "To jest opcja B i dlatego odpada.",
    },
  },
  {
    name: "10_markdown_heading",
    expected: false,
    blocks: {
      version: 2,
      correctReason: "# Nagłówek\ndalej mechanizm.",
    },
  },
  {
    name: "11_emoji",
    expected: false,
    blocks: {
      version: 2,
      correctReason: "Tu jest 💡 i to ma spaść.",
    },
  },
  {
    name: "12_contrast_four_columns",
    expected: false,
    blocks: {
      version: 2,
      correctReason: "Mechanizm.",
      contrast: [["a", "b", "c", "d"]],
    },
  },
  {
    name: "15_statement_set_duplicate_number",
    expected: false,
    blocks: {
      version: 2,
      questionType: "statement_set",
      statements: [
        { id: "s1", number: 1, text: "Stwierdzenie pierwsze", isTrue: true, rationale: "Tak." },
        { id: "s2", number: 1, text: "Stwierdzenie drugie", isTrue: false, rationale: "Nie." },
      ],
      optionStatements: {
        a: ["s1", "s2"],
        b: ["s1"],
        c: ["s2"],
        d: ["s1", "s2"],
        e: ["s2"],
      },
    },
  },
];

test("limity Zod = limity SQL z KROKU 1", () => {
  assert.equal(EXPLANATION_BLOCKS_LIMITS.correctReason, 900);
  assert.equal(EXPLANATION_BLOCKS_LIMITS.takeaway, 200);
  assert.equal(EXPLANATION_BLOCKS_LIMITS.trap, 350);
  assert.equal(EXPLANATION_BLOCKS_LIMITS.distractor, 350);
  assert.equal(EXPLANATION_BLOCKS_LIMITS.contrastCell, 80);
  assert.equal(EXPLANATION_BLOCKS_LIMITS.contrastRows, 5);
  assert.equal(EXPLANATION_BLOCKS_LIMITS.contrastCols, 3);
});

for (const fixture of SQL_FIXTURES) {
  test(`SQL parity ${fixture.name}`, () => {
    assert.equal(
      explanationBlocksValid(fixture.blocks, OPTIONS, CORRECT),
      fixture.expected,
    );
  });
}

test("znaki: emoji spadają, polskie i strzałki przechodzą", () => {
  assert.equal(explanationBlocksTextAllowed("💡"), false);
  assert.equal(explanationBlocksTextAllowed("✅"), false);
  assert.equal(explanationBlocksTextAllowed("ó"), true);
  assert.equal(explanationBlocksTextAllowed("ż"), true);
  assert.equal(explanationBlocksTextAllowed("→"), true);
  assert.equal(explanationBlocksTextAllowed("≥"), true);
});

test("normalize: trim, lowercase kluczy, puste pola wylatują", () => {
  assert.deepEqual(
    normalizeExplanationBlocks({
      version: 2,
      takeaway: "  Reguła  ",
      correctReason: " Powód ",
      trap: "   ",
      distractors: { A: " Błąd A ", b: "" },
    }),
    {
      version: 2,
      takeaway: "Reguła",
      correctReason: "Powód",
      distractors: { a: "Błąd A" },
    },
  );
});

test("inspect: none / legacy / SBA / statement_set / invalid", () => {
  assert.equal(inspectExplanationBlocks(null).status, "none");
  assert.equal(
    inspectExplanationBlocks({
      version: 1,
      correctReason: "Stary kształt bloków.",
    }).status,
    "legacy",
  );
  assert.equal(
    inspectExplanationBlocks({
      version: 2,
      correctReason: "Tylko mechanizm.",
    }).status,
    "sba",
  );

  const statements = [
    { id: "s1", text: "Stwierdzenie pierwsze", isTrue: true, rationale: "Bo tak." },
    { id: "s2", text: "Stwierdzenie drugie", isTrue: false, rationale: "Nie." },
  ];
  const optionStatements = {
    a: ["s1"],
    b: ["s1", "s2"],
    c: ["s2"],
    d: ["s1", "s2"],
    e: ["s2"],
  };
  const options = [
    { id: "a", text: "1" },
    { id: "b", text: "1 i 2" },
    { id: "c", text: "2" },
    { id: "d", text: "1, 2" },
    { id: "e", text: "tylko 2" },
  ];
  const ok = inspectExplanationBlocks(
    {
      version: 2,
      questionType: "statement_set",
      statements,
      optionStatements,
    },
    {
      optionIds: options.map((option) => option.id),
      correctOptionId: "a",
    },
  );
  assert.equal(ok.status, "statement_set");

  const mismatch = inspectExplanationBlocks(
    {
      version: 2,
      questionType: "statement_set",
      statements,
      optionStatements,
    },
    {
      questionId: "q-set-key",
      optionIds: options.map((option) => option.id),
      correctOptionId: "b",
    },
  );
  assert.equal(mismatch.status, "invalid");
  assert.equal(mismatch.issue?.code, "key_mismatch");
  assert.equal(mismatch.status === "invalid" && mismatch.draft?.questionType, "statement_set");
});

test("normalize: null / puste / v1 → null (bez wyjątku)", () => {
  assert.equal(normalizeExplanationBlocks(null), null);
  assert.equal(inspectExplanationBlocks(null).status, "none");
  assert.equal(
    normalizeExplanationBlocks({
      takeaway: "",
      correctReason: "",
      distractors: {},
    }),
    null,
  );
  assert.equal(
    inspectExplanationBlocks({
      takeaway: "",
      correctReason: "",
      distractors: {},
    }).status,
    "invalid",
  );
  assert.equal(
    inspectExplanationBlocks({
      version: 2,
      correctReason: "",
    }).status,
    "invalid",
  );
  assert.equal(
    normalizeExplanationBlocks({
      version: 2,
      correctReason: "",
    }),
    null,
  );
});

test("normalize: zły blok nie rzuca, warn dostaje question id", () => {
  const warnings: unknown[][] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };
  try {
    assert.equal(
      normalizeExplanationBlocks(
        { version: 2, correctReason: "To jest opcja B." },
        { questionId: "q-warn-1" },
      ),
      null,
    );
  } finally {
    console.warn = original;
  }
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0]?.[1], "q-warn-1");
});

test("zestawienie v2: questionType statement_set przechodzi, SBA bez zmian", () => {
  const statements = [
    { id: "s1", text: "Stwierdzenie pierwsze", isTrue: true, rationale: "Bo tak." },
    { id: "s2", text: "Stwierdzenie drugie", isTrue: false, rationale: "Nie." },
  ];
  const blocks = {
    version: 2,
    questionType: "statement_set",
    statements,
    optionStatements: { a: ["s1"], b: ["s1", "s2"], c: ["s2"], d: ["s1", "s2"], e: ["s2"] },
  };
  const options = [
    { id: "a", text: "1" },
    { id: "b", text: "1 i 2" },
    { id: "c", text: "2" },
    { id: "d", text: "1, 2" },
    { id: "e", text: "tylko 2" },
  ];
  assert.equal(explanationBlocksValid(blocks, options, "a"), true);
  assert.equal(
    explanationBlocksValid(
      { version: 2, correctReason: "Tylko mechanizm." },
      OPTIONS,
      CORRECT,
    ),
    true,
  );
});

test("GFM kontrast: parse ↔ serialize", () => {
  const rows = [
    ["cecha", "ostre", "przewlekłe"],
    ["czas", "dni", "miesiące"],
  ];
  const gfm = contrastToGfm(rows);
  assert.match(gfm, /\| --- \|/);
  assert.deepEqual(parseContrastGfm(gfm), rows);
  assert.equal(parseContrastGfm("   "), undefined);
  assert.equal(contrastToMarkdown(rows), gfm);
});
