import assert from "node:assert/strict";
import test from "node:test";
import {
  EXPLANATION_BLOCKS_LIMITS,
  contrastToGfm,
  explanationBlocksTextAllowed,
  explanationBlocksValid,
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

test("normalize: null / puste / v1 → null (bez wyjątku)", () => {
  assert.equal(normalizeExplanationBlocks(null), null);
  assert.equal(
    normalizeExplanationBlocks({
      takeaway: "",
      correctReason: "",
      distractors: {},
    }),
    null,
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

test("GFM kontrast: parse ↔ serialize", () => {
  const rows = [
    ["cecha", "ostre", "przewlekłe"],
    ["czas", "dni", "miesiące"],
  ];
  const gfm = contrastToGfm(rows);
  assert.match(gfm, /\| --- \|/);
  assert.deepEqual(parseContrastGfm(gfm), rows);
  assert.equal(parseContrastGfm("   "), undefined);
});
