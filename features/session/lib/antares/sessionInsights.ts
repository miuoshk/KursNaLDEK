import {
  calibrationScore,
  type CalibrationData,
} from "./confidenceCalibration";

/** Zestaw metryk i krótkich wskazówek po ukończonej sesji. */
export type SessionInsights = {
  accuracy: number;
  avgTimeSeconds: number;
  fastestQuestion: { id: string; time: number } | null;
  slowestQuestion: { id: string; time: number } | null;
  topicAccuracy: Map<
    string,
    { correct: number; total: number; accuracy: number }
  >;
  leechesHit: string[];
  retrievabilityGain: number;
  masteryDelta: Map<string, number>;
  nextSessionFocus: string | null;
  fatigueWarning: string | null;
  calibrationTip: string | null;
};

/** Jedna odpowiedź w sesji (do agregacji insightów). */
export type SessionAnswerData = {
  questionId: string;
  topicId: string;
  isCorrect: boolean;
  confidence: string;
  timeSeconds: number;
  retrievabilityBefore: number;
  retrievabilityAfter: number;
};

function roundPct(x: number): number {
  return Math.round(x * 10) / 10;
}

/**
 * Agreguje metryki po zakończonej sesji: trafność, czasy, tematy, leech, kalibracja, wskazówki.
 *
 * @param newLeechQuestionIds — identyfikatory pytań, u których w tej sesji pojawił się status leecha (domyślnie pusta lista).
 * @param topicNamesById — opcjonalnie nazwy tematów do komunikatu „Skup się na…” (inaczej użyty zostanie `topicId`).
 */
export function generateSessionInsights(
  answers: SessionAnswerData[],
  calibration: CalibrationData,
  masteryBefore: Map<string, number>,
  masteryAfter: Map<string, number>,
  newLeechQuestionIds: string[] = [],
  topicNamesById?: Map<string, string>,
): SessionInsights {
  const n = answers.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const accuracy = n > 0 ? correctCount / n : 0;

  const avgTimeSeconds =
    n > 0
      ? answers.reduce((s, a) => s + a.timeSeconds, 0) / n
      : 0;

  let fastestQuestion: { id: string; time: number } | null = null;
  let slowestQuestion: { id: string; time: number } | null = null;
  if (n > 0) {
    let minT = answers[0].timeSeconds;
    let maxT = answers[0].timeSeconds;
    let minId = answers[0].questionId;
    let maxId = answers[0].questionId;
    for (const a of answers) {
      if (a.timeSeconds < minT) {
        minT = a.timeSeconds;
        minId = a.questionId;
      }
      if (a.timeSeconds > maxT) {
        maxT = a.timeSeconds;
        maxId = a.questionId;
      }
    }
    fastestQuestion = { id: minId, time: minT };
    slowestQuestion = { id: maxId, time: maxT };
  }

  const topicStats = new Map<
    string,
    { correct: number; total: number }
  >();
  for (const a of answers) {
    const cur = topicStats.get(a.topicId) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (a.isCorrect) cur.correct += 1;
    topicStats.set(a.topicId, cur);
  }

  const topicAccuracy = new Map<
    string,
    { correct: number; total: number; accuracy: number }
  >();
  for (const [tid, v] of topicStats) {
    const acc = v.total > 0 ? v.correct / v.total : 0;
    topicAccuracy.set(tid, {
      correct: v.correct,
      total: v.total,
      accuracy: acc,
    });
  }

  const leechSet = new Set(newLeechQuestionIds);
  const leechesHit = [
    ...new Set(
      answers
        .filter((a) => leechSet.has(a.questionId))
        .map((a) => a.questionId),
    ),
  ];

  let retrievabilityGain = 0;
  if (n > 0) {
    const beforeAvg =
      answers.reduce((s, a) => s + a.retrievabilityBefore, 0) / n;
    const afterAvg =
      answers.reduce((s, a) => s + a.retrievabilityAfter, 0) / n;
    retrievabilityGain = afterAvg - beforeAvg;
  }

  const topicIds = new Set([
    ...masteryBefore.keys(),
    ...masteryAfter.keys(),
  ]);
  const masteryDelta = new Map<string, number>();
  for (const tid of topicIds) {
    const b = masteryBefore.get(tid) ?? 0;
    const af = masteryAfter.get(tid) ?? 0;
    masteryDelta.set(tid, af - b);
  }

  let nextSessionFocus: string | null = null;
  if (topicAccuracy.size > 0) {
    let worstTid: string | null = null;
    let worstAcc = 1;
    for (const [tid, row] of topicAccuracy) {
      if (row.accuracy < worstAcc) {
        worstAcc = row.accuracy;
        worstTid = tid;
      }
    }
    if (worstTid !== null && worstAcc < 0.6) {
      const name =
        topicNamesById?.get(worstTid) ?? worstTid;
      const pct = Math.round(worstAcc * 100);
      nextSessionFocus = `Skup się na: ${name} (${pct}%)`;
    }
  }

  const fatigueWarning: string | null = null;

  const score = calibrationScore(calibration);
  let calibrationTip: string | null = null;
  if (score < -0.3 && calibration.na_pewno_total > 0) {
    const wrongShare =
      (calibration.na_pewno_total - calibration.na_pewno_correct) /
      calibration.na_pewno_total;
    const pct = roundPct(wrongShare * 100);
    calibrationTip = `Wydajesz się pewny, ale ${pct}% „na pewno” było błędnych`;
  } else if (score > 0.3 && calibration.nie_wiedzialem_total > 0) {
    const correctShare =
      calibration.nie_wiedzialem_correct /
      calibration.nie_wiedzialem_total;
    const pct = roundPct(correctShare * 100);
    calibrationTip = `Nie doceniasz się — ${pct}% odpowiedzi „nie wiedziałem” było poprawnych`;
  }

  return {
    accuracy,
    avgTimeSeconds,
    fastestQuestion,
    slowestQuestion,
    topicAccuracy,
    leechesHit,
    retrievabilityGain,
    masteryDelta,
    nextSessionFocus,
    fatigueWarning,
    calibrationTip,
  };
}
