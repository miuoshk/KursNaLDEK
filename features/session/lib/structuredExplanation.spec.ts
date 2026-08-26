import assert from "node:assert/strict";
import test from "node:test";
import { normalizeStructuredExplanation } from "@/features/session/lib/structuredExplanation";

test("normalizuje ustrukturyzowane wyjaśnienie", () => {
  assert.deepEqual(
    normalizeStructuredExplanation({
      takeaway: "  Reguła  ",
      correctReason: " Powód ",
      distractors: { A: " Błąd A ", b: "" },
    }),
    {
      takeaway: "Reguła",
      correctReason: "Powód",
      distractors: { a: "Błąd A" },
    },
  );
});

test("zwraca null dla pustej lub błędnej struktury", () => {
  assert.equal(normalizeStructuredExplanation(null), null);
  assert.equal(
    normalizeStructuredExplanation({
      takeaway: "",
      correctReason: "",
      distractors: {},
    }),
    null,
  );
});
