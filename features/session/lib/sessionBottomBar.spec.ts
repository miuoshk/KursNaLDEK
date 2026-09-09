import assert from "node:assert/strict";
import test from "node:test";
import {
  isSessionTargetOffscreen,
  resolveSessionBottomBarMode,
  resolveSessionNextLabel,
  sessionOverlayChromePadding,
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

test("padding overlay stopki liczy wysokość i odstęp, na pulpicie 0", () => {
  assert.equal(sessionOverlayChromePadding(72, true), "84px");
  assert.equal(sessionOverlayChromePadding(0, true), "12px");
  assert.equal(sessionOverlayChromePadding(96, false), "0px");
});

test("werdykt poza ekranem tylko gdy początek wyniku nie jest widoczny", () => {
  const scroller = { top: 80, bottom: 700 };
  assert.equal(
    isSessionTargetOffscreen(scroller, { top: 820 }, 64),
    true,
  );
  assert.equal(
    isSessionTargetOffscreen(scroller, { top: 160 }, 64),
    false,
  );
});
