import { computeSessionXp } from "@/features/session/server/computeSessionXp";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import type { Confidence, SessionAnswer, SessionMode, SessionQuestion, SourceFilter } from "@/features/session/types";
import { isExplanationHiddenForSubject } from "@/lib/content/subjectExplanationPolicy";

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
  topicId?: string;
  sourceFilter?: SourceFilter;
  questions: SessionQuestion[];
  answers: SessionAnswer[];
  profileXp: number | null;
  profileStreak: number;
  dailyPlan?: SessionSummaryData["dailyPlan"];
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
    topicId,
    sourceFilter,
    questions,
    answers,
    profileXp,
    profileStreak,
    dailyPlan,
  } = input;

  const correctAnswers = answers.filter((a) => a.isCorrect).length;
  const n = answers.length;
  const accuracy = n > 0 ? correctAnswers / n : 0;
  const durationSeconds = answers.reduce((s, a) => s + a.timeSpentSeconds, 0);
  const avgTimePerQuestion = n > 0 ? Math.round(durationSeconds / n) : 0;

  const forXp = answers.map((a) => ({
    is_correct: a.isCorrect,
  }));
  const xpEarned = computeSessionXp(forXp, questions.length);

  const topicMap = new Map<string, { c: number; t: number }>();
  const conceptMap = new Map<
    string,
    {
      label: string;
      attempts: number;
      correct: number;
      questionIds: string[];
    }
  >();
  const summaryAnswers: SessionSummaryData["answers"] = [];

  for (const a of answers) {
    const q = questions.find((x) => x.id === a.questionId);
    const topicName = q?.topicName ?? "Temat";
    const cur = topicMap.get(topicName) ?? { c: 0, t: 0 };
    cur.t += 1;
    if (a.isCorrect) cur.c += 1;
    topicMap.set(topicName, cur);
    for (const concept of q?.concepts ?? []) {
      const conceptProgress = conceptMap.get(concept.id) ?? {
        label: concept.label,
        attempts: 0,
        correct: 0,
        questionIds: [],
      };
      conceptProgress.attempts += 1;
      if (a.isCorrect) conceptProgress.correct += 1;
      if (!conceptProgress.questionIds.includes(a.questionId)) {
        conceptProgress.questionIds.push(a.questionId);
      }
      conceptMap.set(concept.id, conceptProgress);
    }

    summaryAnswers.push({
      questionId: a.questionId,
      questionText: q?.text ?? "",
      topicName,
      selectedOptionId: a.selectedOptionId,
      correctOptionId: q?.correctOptionId ?? "",
      selectedOptionText: optionText(q?.options ?? [], a.selectedOptionId),
      correctOptionText: optionText(q?.options ?? [], q?.correctOptionId ?? ""),
      isCorrect: a.isCorrect,
      confidence: a.confidence as Confidence | null,
      timeSpentSeconds: a.timeSpentSeconds,
      explanation: isExplanationHiddenForSubject(subjectId)
        ? undefined
        : q?.explanation || undefined,
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
  const strengthenedConcepts = [...conceptMap.entries()]
    .map(([conceptId, value]) => ({ conceptId, ...value }))
    .sort(
      (a, b) =>
        b.attempts - a.attempts ||
        b.correct - a.correct ||
        a.label.localeCompare(b.label, "pl"),
    );

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
    strengthenedConcepts,
    newXpTotal: baseXp + xpEarned,
    newStreak: profileStreak,
    previousStreakDays: null,
    newQuestionsCount: n,
    reviewCount: 0,
    achievementUnlocked: null,
    subjectId,
    topicId,
    sourceFilter,
    dailyPlan,
  };
}
