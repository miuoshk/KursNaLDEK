import type { SessionSummaryData } from "@/features/session/summaryTypes";

const SESSION_SUMMARY_UPDATED_EVENT = "kurs-session-summary-updated";

export function sessionSummaryStorageKey(sessionId: string): string {
  return `session-summary-${sessionId}`;
}

export function persistSessionSummaryToStorage(
  sessionId: string,
  summary: SessionSummaryData,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      sessionSummaryStorageKey(sessionId),
      JSON.stringify(summary),
    );
    window.dispatchEvent(
      new CustomEvent(SESSION_SUMMARY_UPDATED_EVENT, {
        detail: { sessionId, summary },
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function readCachedSessionSummary(
  sessionId: string,
): SessionSummaryData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(sessionSummaryStorageKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as SessionSummaryData;
  } catch {
    return null;
  }
}

export function subscribeSessionSummary(
  sessionId: string,
  onUpdate: (summary: SessionSummaryData) => void,
): () => void {
  const handler = (event: Event) => {
    const detail = (
      event as CustomEvent<{ sessionId: string; summary: SessionSummaryData }>
    ).detail;
    if (detail?.sessionId === sessionId && detail.summary) {
      onUpdate(detail.summary);
    }
  };
  window.addEventListener(SESSION_SUMMARY_UPDATED_EVENT, handler);
  return () =>
    window.removeEventListener(SESSION_SUMMARY_UPDATED_EVENT, handler);
}

export function mergeEnrichedSessionSummary(
  prev: SessionSummaryData,
  next: SessionSummaryData,
): SessionSummaryData {
  return {
    ...prev,
    previousAccuracy: next.previousAccuracy ?? prev.previousAccuracy,
    newXpTotal: next.newXpTotal ?? prev.newXpTotal,
    newStreak: next.newStreak ?? prev.newStreak,
    previousStreakDays: next.previousStreakDays ?? prev.previousStreakDays,
    achievementUnlocked: next.achievementUnlocked ?? prev.achievementUnlocked,
    newQuestionsCount: next.newQuestionsCount ?? prev.newQuestionsCount,
    reviewCount: next.reviewCount ?? prev.reviewCount,
    xpEarned: next.xpEarned ?? prev.xpEarned,
    sessionInsights: next.sessionInsights ?? prev.sessionInsights,
    examReadiness: next.examReadiness ?? prev.examReadiness,
    dailyPlan: next.dailyPlan ?? prev.dailyPlan,
    strengthenedConcepts:
      next.strengthenedConcepts ?? prev.strengthenedConcepts,
    topicId: prev.topicId ?? next.topicId,
  };
}
