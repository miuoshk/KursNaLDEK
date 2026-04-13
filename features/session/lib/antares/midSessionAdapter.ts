import type { SessionQuestion } from "@/features/session/types";
import type { RankedQuestion } from "./sessionComposer";

/** Stan bieżącej sesji: dotychczasowe odpowiedzi i jeszcze niepokazane pytania (z kompozytora). */
export type SessionState = {
  answeredSoFar: {
    isCorrect: boolean;
    confidence: string;
    timeSeconds: number;
  }[];
  remainingQuestions: RankedQuestion[];
};

export type RankedQuestionWithAdaptFlags = RankedQuestion;

/** Mapuje pytanie z UI na model rankingu ANTARES. */
export function sessionQuestionToRanked(q: SessionQuestion): RankedQuestion {
  return {
    questionId: q.id,
    topicId: q.topicId ?? q.topicName,
    score: 0,
    isLeech: false,
  };
}

function accuracyOf(
  slice: { isCorrect: boolean; confidence: string; timeSeconds: number }[],
): number {
  if (slice.length === 0) return 0;
  return slice.filter((a) => a.isCorrect).length / slice.length;
}

function avgTime(
  slice: { isCorrect: boolean; confidence: string; timeSeconds: number }[],
): number {
  if (slice.length === 0) return 0;
  return (
    slice.reduce((s, a) => s + Math.max(0, a.timeSeconds), 0) / slice.length
  );
}

/**
 * Zwraca pozostale pytania bez zmian (bez kategorii trudnosci adaptacja nie jest mozliwa).
 */
export function adaptRemainingQuestions(
  state: SessionState,
): RankedQuestionWithAdaptFlags[] {
  return state.remainingQuestions.map((q) => ({ ...q }));
}

/**
 * Zwraca pozostale pytania bez zmian (bez kategorii trudnosci adaptacja nie jest mozliwa).
 */
export function applyDifficultySwapsToRemaining(
  remaining: SessionQuestion[],
  _adapted: RankedQuestionWithAdaptFlags[],
): SessionQuestion[] {
  return [...remaining];
}

/**
 * Wykrywa spadek formy (zmeczenie) na podstawie pierwszych vs ostatnich odpowiedzi w sesji.
 */
export function detectFatigue(
  answers: SessionState["answeredSoFar"],
): { isFatigued: boolean; suggestion: string | null } {
  if (answers.length < 15) {
    return { isFatigued: false, suggestion: null };
  }

  const first10 = answers.slice(0, 10);
  const last10 = answers.slice(-10);

  const accFirst = accuracyOf(first10);
  const accLast = accuracyOf(last10);
  const accuracyDrop = accFirst - accLast;

  const avgTimeFirst = avgTime(first10);
  const avgTimeLast = avgTime(last10);
  const timeIncrease =
    avgTimeFirst > 0.001 ? avgTimeLast / avgTimeFirst : avgTimeLast > 0 ? 2 : 1;

  const fatigued = accuracyDrop > 0.2 || timeIncrease > 1.5;

  return {
    isFatigued: fatigued,
    suggestion: fatigued
      ? "Twoja skutecznosc spada \u2014 rozwaz przerwe. Lepiej 2 krotkie sesje niz 1 dluga."
      : null,
  };
}
