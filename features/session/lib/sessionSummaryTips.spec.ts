import assert from "node:assert/strict";
import test from "node:test";
import {
  focusConceptFromBreakdown,
  focusTopicFromBreakdown,
  pickSummaryFocus,
} from "./sessionSummaryTips";

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

test("najsłabsze pojęcie poniżej 60% → wskazówka weak", () => {
  assert.deepEqual(
    focusConceptFromBreakdown([
      { label: "prehabilitacja", correct: 0, attempts: 2 },
      { label: "inny", correct: 3, attempts: 3 },
    ]),
    { concept: "prehabilitacja", percent: 0, weak: true },
  );
});

test("pojęcie wygrywa z tematem serwera i lokalnym tematem", () => {
  const pick = pickSummaryFocus({
    concepts: [{ label: "prehabilitacja", correct: 1, attempts: 3 }],
    topicBreakdown: [{ topicName: "Etiologia próchnicy", accuracy: 0.2 }],
    nextSessionFocus: "Skup się na: Etiologia próchnicy (20%)",
  });
  assert.deepEqual(pick, {
    kind: "concept",
    hint: { concept: "prehabilitacja", percent: 33, weak: true },
  });
});

test("bez pojęć zostaje temat z ANTARES", () => {
  const pick = pickSummaryFocus({
    concepts: [],
    topicBreakdown: [{ topicName: "Etiologia próchnicy", accuracy: 0.2 }],
    nextSessionFocus: "Skup się na: Etiologia próchnicy (20%)",
  });
  assert.deepEqual(pick, {
    kind: "topic-server",
    text: "Skup się na: Etiologia próchnicy (20%)",
  });
});
