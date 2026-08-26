import assert from "node:assert/strict";
import test from "node:test";
import { experimentBucket, variantForRollout } from "./memoryV2Experiment";

test("przypisanie jest deterministyczne", () => {
  const first = experimentBucket("user-123", "memory-v2-rollout");
  const second = experimentBucket("user-123", "memory-v2-rollout");
  assert.equal(first, second);
  assert.ok(first >= 0 && first < 10_000);
});

test("rollout 0%, 5%, 25% i 100% respektuje kubełki", () => {
  assert.equal(variantForRollout(0, 0), "shadow");
  assert.equal(variantForRollout(499, 5), "treatment");
  assert.equal(variantForRollout(500, 5), "shadow");
  assert.equal(variantForRollout(2499, 25), "treatment");
  assert.equal(variantForRollout(2500, 25), "shadow");
  assert.equal(variantForRollout(9999, 100), "treatment");
});
