import type { SessionQuestion } from "@/features/session/types";
import {
  defaultQuestionMeta,
  personalEaseScore,
} from "@/features/session/lib/antares/questionMeta";
import type { RankedQuestion } from "./sessionComposer";

export const RESERVE_RATIO = 0.3;
export const RESERVE_MIN = 2;
export const RESERVE_MAX = 10;

/** Ile pytań trzymać w rezerwie (0 = wyłączone dla bardzo krótkich sesji). */
export function reservePoolSize(sessionCount: number): number {
  if (sessionCount < 5) return 0;
  return Math.min(
    RESERVE_MAX,
    Math.max(RESERVE_MIN, Math.ceil(sessionCount * RESERVE_RATIO)),
  );
}

function easeOfRanked(q: RankedQuestion): number {
  if (q.antares) return personalEaseScore(q.antares);
  return (q.retrievability ?? 0) * 0.6 - (q.isLeech ? 0.15 : 0);
}

/** Dedup po questionId — zostawia wpis z wyższym score. */
export function mergeRankedUnique(lists: RankedQuestion[][]): RankedQuestion[] {
  const byId = new Map<string, RankedQuestion>();
  for (const list of lists) {
    for (const q of list) {
      const prev = byId.get(q.questionId);
      if (!prev || q.score > prev.score) byId.set(q.questionId, q);
    }
  }
  return [...byId.values()];
}

/**
 * Wybiera identyfikatory rezerwy: łatwiejsze dla usera (wyższy personalEase),
 * pomijając pytania już w sesji.
 */
export function buildReserveQuestionIds(
  sessionCount: number,
  chosenIds: string[],
  allRanked: RankedQuestion[],
): string[] {
  const n = reservePoolSize(sessionCount);
  if (n === 0) return [];

  const chosen = new Set(chosenIds);
  return allRanked
    .filter((q) => !chosen.has(q.questionId))
    .sort((a, b) => easeOfRanked(b) - easeOfRanked(a))
    .slice(0, n)
    .map((q) => q.questionId);
}

/** Prosta rezerwa z puli, gdy ANTARES zwróci fallback. */
export function buildFallbackReserveIds(
  sessionCount: number,
  chosenIds: string[],
  pool: string[],
): string[] {
  const n = reservePoolSize(sessionCount);
  if (n === 0) return [];
  const chosen = new Set(chosenIds);
  return pool.filter((id) => !chosen.has(id)).slice(0, n);
}

function trailingWrongStreak(
  answers: { isCorrect: boolean }[],
): number {
  let n = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (answers[i].isCorrect) break;
    n += 1;
  }
  return n;
}

function trailingCorrectStreak(
  answers: { isCorrect: boolean }[],
): number {
  let n = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (!answers[i].isCorrect) break;
    n += 1;
  }
  return n;
}

function easeOfQuestion(q: SessionQuestion): number {
  return personalEaseScore(q.antares ?? defaultQuestionMeta());
}

export type ReserveSwapResult = {
  tail: SessionQuestion[];
  reserve: SessionQuestion[];
  swapped: boolean;
};

/**
 * Po serii błędów podmienia następne pytanie na łatwiejsze z rezerwy.
 * Po serii trafień — na trudniejsze (niższy ease) z rezerwy.
 */
export function applyReserveSwap(
  tail: SessionQuestion[],
  reserve: SessionQuestion[],
  answeredSoFar: { isCorrect: boolean }[],
): ReserveSwapResult {
  if (tail.length === 0 || reserve.length === 0) {
    return { tail, reserve, swapped: false };
  }

  const wrongStreak = trailingWrongStreak(answeredSoFar);
  const correctStreak = trailingCorrectStreak(answeredSoFar);
  const next = tail[0];
  const nextEase = easeOfQuestion(next);

  let pickIdx = -1;

  if (wrongStreak >= 3) {
    let bestEase = nextEase + 0.05;
    for (let i = 0; i < reserve.length; i++) {
      const ease = easeOfQuestion(reserve[i]);
      if (ease > bestEase) {
        bestEase = ease;
        pickIdx = i;
      }
    }
  } else if (correctStreak >= 5) {
    let lowestEase = nextEase - 0.05;
    for (let i = 0; i < reserve.length; i++) {
      const ease = easeOfQuestion(reserve[i]);
      if (ease < lowestEase) {
        lowestEase = ease;
        pickIdx = i;
      }
    }
  }

  if (pickIdx < 0) {
    return { tail, reserve, swapped: false };
  }

  const picked = reserve[pickIdx];
  const bumped = next;
  const newReserve = [
    ...reserve.slice(0, pickIdx),
    ...reserve.slice(pickIdx + 1),
    bumped,
  ];
  return {
    tail: [picked, ...tail.slice(1)],
    reserve: newReserve,
    swapped: true,
  };
}
