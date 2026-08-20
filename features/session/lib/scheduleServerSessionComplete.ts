import { completeSession } from "@/features/session/api/completeSession";
import { persistSessionSummaryToStorage } from "@/features/session/lib/sessionSummaryStorage";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

/**
 * Fire-and-forget server completion. The client summary is already on screen;
 * this persists XP / streak / previousAccuracy and broadcasts so the visible
 * summary can enrich in place. ANTARES insights still arrive via polling.
 */
export function scheduleServerSessionComplete(
  sessionId: string,
  sessionStartMs: number,
  onEnrich?: (summary: SessionSummaryData) => void,
  clientTopicId?: string,
): void {
  const dur = Math.floor((Date.now() - sessionStartMs) / 1000);
  void completeSession({ sessionId, durationSecondsFallback: dur })
    .then((comp) => {
      if (comp.ok) {
        const summary = {
          ...comp.summary,
          topicId: clientTopicId ?? comp.summary.topicId,
        };
        persistSessionSummaryToStorage(sessionId, summary);
        onEnrich?.(summary);
      }
    })
    .catch(console.error);
}
