import assert from "node:assert/strict";
import test from "node:test";
import {
  canConsumeHorizontalDelta,
  horizontalScrollDelta,
} from "./horizontalCarousel";

test("trackpad pionowy staje się poziomym scrollem", () => {
  assert.equal(horizontalScrollDelta(0, 40), 40);
  assert.equal(horizontalScrollDelta(-12, 3), -12);
});

test("na krawędzi nie przechwytuje kółka", () => {
  assert.equal(canConsumeHorizontalDelta(0, 200, 800, -20), false);
  assert.equal(canConsumeHorizontalDelta(600, 200, 800, 20), false);
  assert.equal(canConsumeHorizontalDelta(100, 200, 800, 20), true);
  assert.equal(canConsumeHorizontalDelta(0, 200, 180, 20), false);
});
