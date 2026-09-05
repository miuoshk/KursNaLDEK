import assert from "node:assert/strict";
import test from "node:test";
import { classifyDistractorRecommendation } from "./export-distractor-stats.mjs";

test("progi CSV: ≥15 pisz, 3–15 opcjonalnie, <3 martwy, klucz osobno", () => {
  assert.equal(classifyDistractorRecommendation(40, false), "pisz");
  assert.equal(classifyDistractorRecommendation(15, false), "pisz");
  assert.equal(classifyDistractorRecommendation(14.9, false), "opcjonalnie");
  assert.equal(classifyDistractorRecommendation(3, false), "opcjonalnie");
  assert.equal(classifyDistractorRecommendation(2.99, false), "martwy dystraktor");
  assert.equal(classifyDistractorRecommendation(null, false), "martwy dystraktor");
  assert.equal(classifyDistractorRecommendation(90, true), "klucz");
});
