import assert from "node:assert/strict";
import test from "node:test";
import { nextSelectedOptionId } from "./sessionOptionSelect";

test("pierwszy klik zaznacza", () => {
  assert.equal(nextSelectedOptionId(null, "b"), "b");
});

test("klik tej samej odznacza", () => {
  assert.equal(nextSelectedOptionId("b", "b"), null);
});

test("klik innej podmienia wybór", () => {
  assert.equal(nextSelectedOptionId("b", "c"), "c");
});
