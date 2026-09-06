import assert from "node:assert/strict";
import test from "node:test";
import { focusTopicFromBreakdown } from "./sessionSummaryTips";

test("najsłabszy temat poniżej 60% → wskazówka weak", () => {
  assert.deepEqual(
    focusTopicFromBreakdown([
      { topicName: "Etiologia próchnicy", accuracy: 0.2 },
      { topicName: "Inny", accuracy: 1 },
    ]),
    { topic: "Etiologia próchnicy", percent: 20, weak: true },
  );
});

test("temat ≥ 60% nadal daje wskazówkę (nie-weak)", () => {
  assert.deepEqual(
    focusTopicFromBreakdown([{ topicName: "Anatomia", accuracy: 0.8 }]),
    { topic: "Anatomia", percent: 80, weak: false },
  );
});

test("pusta lista albo pusta nazwa → brak wskazówki", () => {
  assert.equal(focusTopicFromBreakdown([]), null);
  assert.equal(focusTopicFromBreakdown([{ topicName: "  ", accuracy: 0 }]), null);
});
