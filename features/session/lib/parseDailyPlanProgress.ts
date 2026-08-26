import type { SessionSummaryData } from "@/features/session/summaryTypes";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function finiteNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function parseDailyPlanProgress(
  snapshot: unknown,
  answeredQuestions: number,
  durationSeconds: number,
): SessionSummaryData["dailyPlan"] {
  const root = asRecord(snapshot);
  const daily = asRecord(root?.daily);
  if (!daily) return undefined;

  const targetMinutes = Math.max(1, finiteNumber(daily.budgetMinutes, 25));
  const plannedQuestions = Math.max(
    1,
    finiteNumber(daily.plannedQuestions, answeredQuestions),
  );
  const questionsTodayAtStart = Math.max(
    0,
    finiteNumber(daily.questionsTodayAtStart),
  );
  const estimatedMinutes = Math.max(
    1,
    finiteNumber(daily.estimatedMinutes, targetMinutes),
  );
  const expectedSecondsPerQuestion = (estimatedMinutes * 60) / plannedQuestions;
  const completedMinutesToday = Math.min(
    targetMinutes,
    Math.round(
      (questionsTodayAtStart * expectedSecondsPerQuestion + durationSeconds) /
        60,
    ),
  );
  const targetQuestions = Math.max(
    1,
    finiteNumber(daily.targetQuestions, plannedQuestions),
  );

  return {
    scopeSubjectId:
      typeof daily.scopeSubjectId === "string" ? daily.scopeSubjectId : null,
    targetMinutes,
    estimatedMinutes,
    targetQuestions,
    plannedQuestions,
    answeredQuestions,
    questionsTodayAtStart,
    completedMinutesToday,
    sessionCompletion: Math.min(1, answeredQuestions / plannedQuestions),
    dailyCompletion: Math.min(
      1,
      (questionsTodayAtStart + answeredQuestions) / targetQuestions,
    ),
    dueCount: Math.max(0, finiteNumber(daily.dueCount)),
    newCount: Math.max(0, finiteNumber(daily.newCount)),
    remediationCount: Math.max(0, finiteNumber(daily.remediationCount)),
    targetRetention: Math.min(
      1,
      Math.max(0, finiteNumber(daily.targetRetention, 0.9)),
    ),
  };
}
