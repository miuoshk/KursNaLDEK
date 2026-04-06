import { computeSessionXp } from "@/features/session/server/computeSessionXp";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import type { Confidence, SessionAnswer, SessionMode, SessionQuestion } from "@/features/session/types";

const TRUNC = 80;

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1)}…`;
}

function optionText(opts: { id: string; text: string }[], id: string) {
  return opts.find((o) => o.id === id)?.text ?? id;
}

function maxConsecutiveCorrect(rows: { isCorrect: boolean }[]): number {
  let best = 0;
  let cur = 0;
  for (const r of rows) {
    if (r.isCorrect) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}

export type BuildClientSessionSummaryInput = {
  sessionId: string;
  subjectId: string;
  subjectName: string;
  subjectShortName: string;
  mode: SessionMode;
  questions: SessionQuestion[];
  answers: SessionAnswer[];
  profileXp: number | null;
  profileStreak: number;
};

export function buildClientSessionSummary(
  input: BuildClientSessionSummaryInput,
): SessionSummaryData {
  const {
    sessionId,
    subjectId,
    subjectName,
    subjectShortName,
    mode,
    questions,
    answers,
    profileXp,
    profileStreak,
  } = input;

  const correctAnswers = answers.filter((a) => a.isCorrect).length;
  const n = answers.length;
  const accuracy = n > 0 ? correctAnswers / n : 0;
  const durationSeconds = answers.reduce((s, a) => s + a.timeSpentSeconds, 0);
  const avgTimePerQuestion = n > 0 ? Math.round(durationSeconds / n) : 0;

  const forXp = answers.map((a) => {
    const q = questions.find((x) => x.id === a.questionId);
    return {
      is_correct: a.isCorrect,
      difficulty: q?.difficulty ?? "srednie",
    };
  });
  const xpEarned = computeSessionXp(forXp, questions.length);

  const topicMap = new Map<string, { c: number; t: number }>();
  const summaryAnswers: SessionSummaryData["answers"] = [];

  for (const a of answers) {
    const q = questions.find((x) => x.id === a.questionId);
    const topicName = q?.topicName ?? "Temat";
    const cur = topicMap.get(topicName) ?? { c: 0, t: 0 };
    cur.t += 1;
    if (a.isCorrect) cur.c += 1;
    topicMap.set(topicName, cur);

    summaryAnswers.push({
      questionId: a.questionId,
      questionText: truncate(q?.text ?? "", TRUNC),
      topicName,
      selectedOptionId: a.selectedOptionId,
      correctOptionId: q?.correctOptionId ?? "",
      selectedOptionText: optionText(q?.options ?? [], a.selectedOptionId),
      correctOptionText: optionText(q?.options ?? [], q?.correctOptionId ?? ""),
      isCorrect: a.isCorrect,
      confidence: a.confidence as Confidence | null,
      timeSpentSeconds: a.timeSpentSeconds,
    });
  }

  const topicBreakdown = [...topicMap.entries()]
    .map(([topicName, v]) => ({
      topicName,
      correct: v.c,
      total: v.t,
      accuracy: v.t > 0 ? v.c / v.t : 0,
    }))
    .sort((x, y) => x.accuracy - y.accuracy);

  const baseXp = profileXp ?? 0;

  return {
    sessionId,
    subjectName,
    subjectShortName,
    mode,
    totalQuestions: questions.length,
    correctAnswers,
    accuracy,
    durationSeconds,
    avgTimePerQuestion,
    xpEarned,
    longestStreak: maxConsecutiveCorrect(answers.map((a) => ({ isCorrect: a.isCorrect }))),
    previousAccuracy: null,
    answers: summaryAnswers,
    topicBreakdown,
    newXpTotal: baseXp + xpEarned,
    newStreak: profileStreak,
    previousStreakDays: null,
    newQuestionsCount: n,
    reviewCount: 0,
    achievementUnlocked: null,
    subjectId,
  };
}
