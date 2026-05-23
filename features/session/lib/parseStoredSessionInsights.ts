import type {
  ExamReadinessSnapshot,
  SessionInsightsPayload,
} from "@/features/session/summaryTypes";

export type ParsedStoredInsights = {
  sessionInsights: SessionInsightsPayload | null;
  examReadiness: ExamReadinessSnapshot | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Parsuje JSONB `study_sessions.session_insights` (z opcjonalnym examReadiness). */
export function parseStoredSessionInsights(
  raw: unknown,
): ParsedStoredInsights {
  if (!isRecord(raw)) {
    return { sessionInsights: null, examReadiness: null };
  }

  const examRaw = raw.examReadiness;
  let examReadiness: ExamReadinessSnapshot | null = null;
  if (isRecord(examRaw) && typeof examRaw.score === "number") {
    examReadiness = {
      score: examRaw.score as number,
      verdict: String(examRaw.verdict ?? ""),
      weakestTopics: Array.isArray(examRaw.weakestTopics)
        ? (examRaw.weakestTopics as string[])
        : [],
      estimatedReadyDate:
        typeof examRaw.estimatedReadyDate === "string"
          ? examRaw.estimatedReadyDate
          : null,
      dailyRecommendation: Number(examRaw.dailyRecommendation ?? 25),
    };
  }

  const {
    examReadiness: _omit,
    ...insightFields
  } = raw;

  const hasInsightData =
    typeof insightFields.accuracy === "number" ||
    insightFields.nextSessionFocus != null ||
    insightFields.calibrationTip != null;

  const sessionInsights = hasInsightData
    ? (insightFields as unknown as SessionInsightsPayload)
    : null;

  return { sessionInsights, examReadiness };
}
