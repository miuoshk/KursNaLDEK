import assert from "node:assert/strict";
import test from "node:test";
import { detectFatigue } from "./midSessionAdapter";

test("wykrywa jednoczesny spadek trafności i wzrost czasu", () => {
  const answers = [
    ...Array.from({ length: 10 }, () => ({
      isCorrect: true,
      confidence: "troche",
      timeSeconds: 20,
    })),
    ...Array.from({ length: 10 }, () => ({
      isCorrect: false,
      confidence: "nie_wiedzialem",
      timeSeconds: 45,
    })),
  ];

  assert.equal(detectFatigue(answers).isFatigued, true);
});

test("nie sygnalizuje zmęczenia w stabilnej krótkiej sesji", () => {
  const answers = Array.from({ length: 14 }, () => ({
    isCorrect: true,
    confidence: "troche",
    timeSeconds: 20,
  }));

  assert.deepEqual(detectFatigue(answers), {
    isFatigued: false,
    suggestion: null,
  });
});
