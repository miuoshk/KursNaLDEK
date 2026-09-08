import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveSessionBottomBarMode,
  resolveSessionNextLabel,
} from "@/features/session/lib/sessionBottomBar";

test("ukryta przed wyborem opcji", () => {
  assert.equal(
    resolveSessionBottomBarMode({
      isPrzeglad: false,
      isWaitingForConfidence: false,
      isShowingFeedback: false,
    }),
    "hidden",
  );
});

test("inteligentna po selectOption → confidence", () => {
  assert.equal(
    resolveSessionBottomBarMode({
      isPrzeglad: false,
      isWaitingForConfidence: true,
      isShowingFeedback: false,
    }),
    "confidence",
  );
});

test("inteligentna po revealFeedback → next", () => {
  assert.equal(
    resolveSessionBottomBarMode({
      isPrzeglad: false,
      isWaitingForConfidence: false,
      isShowingFeedback: true,
    }),
    "next",
  );
});

test("przegląd nigdy nie pokazuje confidence", () => {
  assert.equal(
    resolveSessionBottomBarMode({
      isPrzeglad: true,
      isWaitingForConfidence: true,
      isShowingFeedback: false,
    }),
    "hidden",
  );
  assert.equal(
    resolveSessionBottomBarMode({
      isPrzeglad: true,
      isWaitingForConfidence: false,
      isShowingFeedback: true,
    }),
    "next",
  );
});

test("ostatnie pytanie i pełna sesja → Zobacz podsumowanie", () => {
  assert.equal(
    resolveSessionNextLabel({
      isLast: true,
      allAnswered: true,
      canEndPrzeglad: false,
      continueLabel: "Dalej",
      summaryLabel: "Zobacz podsumowanie",
    }),
    "Zobacz podsumowanie",
  );
  assert.equal(
    resolveSessionNextLabel({
      isLast: false,
      allAnswered: false,
      canEndPrzeglad: false,
      continueLabel: "Dalej",
      summaryLabel: "Zobacz podsumowanie",
    }),
    "Dalej",
  );
});
