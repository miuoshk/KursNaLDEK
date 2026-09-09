import assert from "node:assert/strict";
import test from "node:test";
import { TEST_STATEMENT_SET_BLOCKS } from "@/features/session/fixtures/statementSetPreview";
import { renderExplanationBlocks } from "@/features/shared/lib/renderExplanationBlocks";

const OPTIONS = [
  { id: "a", text: "1, 2 i 3" },
  { id: "b", text: "1, 3 i 5" },
  { id: "c", text: "1, 2 i 5" },
  { id: "d", text: "2, 3 i 5" },
  { id: "e", text: "1 i 3" },
];

test("proza zestawienia ma zasadę i stwierdzenia, bez kombinacji A–E", () => {
  const prose = renderExplanationBlocks(TEST_STATEMENT_SET_BLOCKS, OPTIONS, "b");
  assert.match(prose, /\*\*Poprawna odpowiedź:\*\* 1, 3 i 5/);
  assert.match(prose, /> \*\*Zasada:\*\* Najpierw oceń każde stwierdzenie/);
  assert.match(prose, /\*\*Stwierdzenia\*\*/);
  assert.match(prose, /1\. Koło ma jedną krawędź — Prawda/);
  assert.match(prose, /2\. Trójkąt ma cztery boki — Fałsz/);
  assert.match(prose, /4\. Sześciokąt foremny ma trzy boki — Fałsz/);
  assert.match(prose, /5\. Pięciokąt foremny ma równe boki — Prawda/);
  assert.doesNotMatch(prose, /Dlaczego nie pozostałe/);
  assert.doesNotMatch(prose, /\*1, 2 i 3\*/);
});

test("proza SBA zostaje przy dystraktorach", () => {
  const prose = renderExplanationBlocks(
    {
      version: 2,
      correctReason: "Mechanizm.",
      distractors: { a: "Nie alfa." },
    },
    [
      { id: "a", text: "Alfa" },
      { id: "b", text: "Beta" },
    ],
    "b",
  );
  assert.match(prose, /Mechanizm/);
  assert.match(prose, /Dlaczego nie pozostałe/);
  assert.match(prose, /\*Alfa\* — Nie alfa/);
});
