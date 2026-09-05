import assert from "node:assert/strict";
import test from "node:test";
import { sessionStudyPhase } from "@/features/session/lib/sessionStudyPhase";
import type { SessionAnswer, SessionMode } from "@/features/session/types";

type FakeSession = {
  selectedOptionId: string | null;
  isShowingFeedback: boolean;
  answers: SessionAnswer[];
  selectOption: (id: string) => void;
  revealFeedback: () => void;
  recordAnswer: (a: SessionAnswer) => void;
};

function createFakeSession(): FakeSession {
  const s: FakeSession = {
    selectedOptionId: null,
    isShowingFeedback: false,
    answers: [],
    selectOption(id) {
      if (s.isShowingFeedback || s.answers.length > 0 || s.selectedOptionId) {
        return;
      }
      s.selectedOptionId = id;
    },
    revealFeedback() {
      if (s.isShowingFeedback || s.selectedOptionId == null) return;
      s.isShowingFeedback = true;
    },
    recordAnswer(answer) {
      s.answers.push(answer);
    },
  };
  return s;
}

function phase(mode: SessionMode, s: FakeSession) {
  return sessionStudyPhase({
    mode,
    selectedOptionId: s.selectedOptionId,
    isShowingFeedback: s.isShowingFeedback,
    isCurrentAnswered: s.answers.length > 0,
  });
}

test("inteligentna: choose → pasek pewności → werdykt; submit z pewnością, bez advance", () => {
  const s = createFakeSession();
  const submits: Array<{
    confidence: string | null;
    advance: boolean;
    confidenceLatencyMs: number | null;
  }> = [];

  assert.equal(phase("inteligentna", s), "choose");
  assert.equal(s.isShowingFeedback, false);

  s.selectOption("c");
  assert.equal(phase("inteligentna", s), "awaiting_confidence");
  assert.equal(s.isShowingFeedback, false);
  assert.equal(s.answers.length, 0);

  s.revealFeedback();
  s.recordAnswer({
    questionId: "q1",
    selectedOptionId: "c",
    isCorrect: true,
    confidence: "na_pewno",
    timeSpentSeconds: 12,
  });
  submits.push({
    confidence: "na_pewno",
    advance: false,
    confidenceLatencyMs: 840,
  });

  assert.equal(phase("inteligentna", s), "feedback");
  assert.equal(s.isShowingFeedback, true);
  assert.equal(s.answers[0]?.confidence, "na_pewno");
  assert.deepEqual(submits[0], {
    confidence: "na_pewno",
    advance: false,
    confidenceLatencyMs: 840,
  });
});

test("inteligentna: Pomiń ocenę wysyła troche, nie null", () => {
  const s = createFakeSession();
  s.selectOption("a");
  s.revealFeedback();
  s.recordAnswer({
    questionId: "q1",
    selectedOptionId: "a",
    isCorrect: false,
    confidence: "troche",
    timeSpentSeconds: 8,
  });
  assert.equal(s.answers[0]?.confidence, "troche");
});

test("przegląd: klik → werdykt w jednym kroku, confidence=null, bez paska", () => {
  const s = createFakeSession();
  assert.equal(phase("przeglad", s), "choose");

  s.selectOption("b");
  s.revealFeedback();
  s.recordAnswer({
    questionId: "q1",
    selectedOptionId: "b",
    isCorrect: true,
    confidence: null,
    timeSpentSeconds: 5,
  });

  assert.equal(phase("przeglad", s), "feedback");
  assert.equal(s.answers[0]?.confidence, null);
  assert.notEqual(phase("przeglad", s), "awaiting_confidence");
});

test("przegląd nigdy nie wchodzi w awaiting_confidence", () => {
  const s = createFakeSession();
  s.selectOption("a");
  assert.equal(phase("przeglad", s), "choose");
  s.revealFeedback();
  assert.equal(phase("przeglad", s), "feedback");
});
