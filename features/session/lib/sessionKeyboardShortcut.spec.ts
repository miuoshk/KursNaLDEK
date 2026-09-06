import assert from "node:assert/strict";
import test from "node:test";
import { resolveSessionShortcut } from "./sessionKeyboardShortcut";

const waiting = {
  currentIndex: 0,
  total: 3,
  isShowingFeedback: false,
  isCurrentAnswered: false,
  isWaitingForConfidence: true,
  isPrzeglad: false,
  optionCount: 5,
};

const afterReveal = {
  ...waiting,
  isWaitingForConfidence: false,
  isShowingFeedback: true,
  isCurrentAnswered: true,
};

const choosing = {
  ...waiting,
  isWaitingForConfidence: false,
};

test("1/2/3 na pasku pewności, Enter i spacja nie idą dalej", () => {
  assert.deepEqual(resolveSessionShortcut("1", waiting), {
    type: "confidence",
    confidence: "nie_wiedzialem",
  });
  assert.deepEqual(resolveSessionShortcut("2", waiting), {
    type: "confidence",
    confidence: "troche",
  });
  assert.deepEqual(resolveSessionShortcut("3", waiting), {
    type: "confidence",
    confidence: "na_pewno",
  });
  assert.deepEqual(resolveSessionShortcut("Enter", waiting), { type: "none" });
  assert.deepEqual(resolveSessionShortcut(" ", waiting), { type: "none" });
  assert.deepEqual(resolveSessionShortcut("ArrowRight", waiting), {
    type: "none",
  });
});

test("po werdykcie Enter i spacja idą dalej; 1 nie wybiera opcji", () => {
  assert.deepEqual(resolveSessionShortcut("Enter", afterReveal), {
    type: "next",
  });
  assert.deepEqual(resolveSessionShortcut(" ", afterReveal), { type: "next" });
  assert.deepEqual(resolveSessionShortcut("1", afterReveal), { type: "none" });
});

test("przed wyborem 1–5 wybiera opcję", () => {
  assert.deepEqual(resolveSessionShortcut("1", choosing), {
    type: "select",
    optionIndex: 0,
  });
  assert.deepEqual(resolveSessionShortcut("5", choosing), {
    type: "select",
    optionIndex: 4,
  });
});
