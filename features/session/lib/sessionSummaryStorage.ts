import type { SessionSummaryData } from "@/features/session/summaryTypes";

export function sessionSummaryStorageKey(sessionId: string): string {
  return `session-summary-${sessionId}`;
}

export function persistSessionSummaryToStorage(
  sessionId: string,
  summary: SessionSummaryData,
): void {
  try {
    sessionStorage.setItem(sessionSummaryStorageKey(sessionId), JSON.stringify(summary));
  } catch {
    /* ignore */
  }
}
