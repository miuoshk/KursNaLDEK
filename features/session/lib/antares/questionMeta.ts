import type { SessionQuestion, SessionQuestionMeta } from "@/features/session/types";

/** Domyślne meta dla pytania bez historii u usera. */
export function defaultQuestionMeta(topicMastery = 0): SessionQuestionMeta {
  return {
    retrievability: 0,
    fsrsDifficulty: 0.3,
    isLeech: false,
    isNew: true,
    priorAccuracy: null,
    avgTimeSeconds: null,
    topicMastery,
  };
}

export function buildQuestionMeta(input: {
  retrievability: number;
  fsrsDifficulty: number;
  isLeech: boolean;
  isNew: boolean;
  timesAnswered: number;
  timesCorrect: number;
  avgTimeSeconds: number | null;
  topicMastery: number;
}): SessionQuestionMeta {
  const priorAccuracy =
    input.timesAnswered > 0 ? input.timesCorrect / input.timesAnswered : null;
  return {
    retrievability: input.retrievability,
    fsrsDifficulty: input.fsrsDifficulty,
    isLeech: input.isLeech,
    isNew: input.isNew,
    priorAccuracy,
    avgTimeSeconds: input.avgTimeSeconds,
    topicMastery: input.topicMastery,
  };
}

/**
 * Wyższy wynik = łatwiej teraz dla tego usera (nie trudność treści pytania).
 */
export function personalEaseScore(meta: SessionQuestionMeta): number {
  const acc = meta.priorAccuracy ?? (meta.isNew ? 0.45 : 0.5);
  const fsrsEase = 1 - Math.min(1, Math.max(0, meta.fsrsDifficulty / 10));
  const leechPenalty = meta.isLeech ? 0.15 : 0;
  return (
    meta.retrievability * 0.4 +
    acc * 0.3 +
    meta.topicMastery * 0.2 +
    fsrsEase * 0.1 -
    leechPenalty
  );
}

export function attachAntaresMetaToQuestions(
  questions: SessionQuestion[],
  metaById: Map<string, SessionQuestionMeta> | Record<string, SessionQuestionMeta>,
): SessionQuestion[] {
  const lookup = (id: string): SessionQuestionMeta | undefined =>
    metaById instanceof Map ? metaById.get(id) : metaById[id];

  return questions.map((q) => ({
    ...q,
    antares: lookup(q.id) ?? defaultQuestionMeta(),
  }));
}

export function metaMapToRecord(
  map: Map<string, SessionQuestionMeta>,
): Record<string, SessionQuestionMeta> {
  return Object.fromEntries(map.entries());
}
