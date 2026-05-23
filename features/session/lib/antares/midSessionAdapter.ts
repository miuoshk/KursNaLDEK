import type { SessionQuestion } from "@/features/session/types";
import {
  defaultQuestionMeta,
  personalEaseScore,
} from "@/features/session/lib/antares/questionMeta";
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

function metaOf(q: RankedQuestion) {
  return q.antares ?? defaultQuestionMeta();
}

/** Mapuje pytanie z UI na model rankingu ANTARES (z metadanymi karty usera). */
export function sessionQuestionToRanked(q: SessionQuestion): RankedQuestion {
  const antares = q.antares ?? defaultQuestionMeta();
  return {
    questionId: q.id,
    topicId: q.topicId ?? q.topicName,
    score: 0,
    isLeech: antares.isLeech,
    retrievability: antares.retrievability,
    antares,
  };
}

function trailingWrongStreak(
  answers: SessionState["answeredSoFar"],
): number {
  let n = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (answers[i].isCorrect) break;
    n += 1;
  }
  return n;
}

function trailingCorrectStreak(
  answers: SessionState["answeredSoFar"],
): number {
  let n = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (!answers[i].isCorrect) break;
    n += 1;
  }
  return n;
}

/** Leechy na koniec taila — unikamy kończenia sesji frustracją. */
function deprioritizeLeechesAtEnd(items: RankedQuestion[]): RankedQuestion[] {
  if (items.length <= 2) return items;
  const leeches = items.filter((q) => q.isLeech);
  if (leeches.length === 0) return items;
  const rest = items.filter((q) => !q.isLeech);
  const tail = items.slice(-2);
  const leechInTail = tail.filter((q) => q.isLeech).length;
  if (leechInTail === 0) return items;
  const head = rest.slice(0, Math.max(0, rest.length - (2 - leechInTail)));
  const mid = rest.slice(head.length);
  return [...head, ...mid, ...leeches.slice(0, Math.min(1, leeches.length))];
}

/**
 * Dostosowuje kolejność pozostałych pytań na podstawie formy w sesji
 * i osobistej „łatwości” karty (retrievability, historia, mastery).
 */
export function adaptRemainingQuestions(
  state: SessionState,
): RankedQuestionWithAdaptFlags[] {
  const { answeredSoFar, remainingQuestions } = state;
  if (remainingQuestions.length <= 1) {
    return remainingQuestions.map((q) => ({ ...q }));
  }

  let sorted = [...remainingQuestions];
  const wrongStreak = trailingWrongStreak(answeredSoFar);
  const correctStreak = trailingCorrectStreak(answeredSoFar);

  if (wrongStreak >= 3) {
    sorted.sort(
      (a, b) => personalEaseScore(metaOf(b)) - personalEaseScore(metaOf(a)),
    );
  } else if (correctStreak >= 5) {
    sorted.sort((a, b) => b.score - a.score);
  }

  return deprioritizeLeechesAtEnd(sorted);
}

/** Przekłada nową kolejność rankingu z powrotem na pytania sesji. */
export function applyDifficultySwapsToRemaining(
  remaining: SessionQuestion[],
  adapted: RankedQuestionWithAdaptFlags[],
): SessionQuestion[] {
  const byId = new Map(remaining.map((q) => [q.id, q]));
  const out: SessionQuestion[] = [];
  for (const r of adapted) {
    const q = byId.get(r.questionId);
    if (q) out.push(q);
  }
  for (const q of remaining) {
    if (!out.some((x) => x.id === q.id)) out.push(q);
  }
  return out;
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
 * Wykrywa spadek formy (zmęczenie) na podstawie pierwszych vs ostatnich odpowiedzi w sesji.
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
