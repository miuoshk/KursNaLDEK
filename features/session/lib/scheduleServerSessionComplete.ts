import { completeSession } from "@/features/session/api/completeSession";
import { persistSessionSummaryToStorage } from "@/features/session/lib/sessionSummaryStorage";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

/**
 * Fire-and-forget server completion. When the server returns an enriched
 * summary (ANTARES insights, XP, streak, etc.), calls `onEnrich` so the
 * already-visible client summary can be updated in-place.
 *
 * We intentionally do NOT change the browser URL here — the summary is
 * already rendered client-side via React state in SessionStudyView. The
 * permanent `/podsumowanie` URL will be used when revisiting the session.
 */
export function scheduleServerSessionComplete(
  sessionId: string,
  sessionStartMs: number,
  onEnrich?: (summary: SessionSummaryData) => void,
): void {
  const dur = Math.floor((Date.now() - sessionStartMs) / 1000);
  void completeSession({ sessionId, durationSecondsFallback: dur })
    .then((comp) => {
      if (comp.ok) {
        persistSessionSummaryToStorage(sessionId, comp.summary);
        onEnrich?.(comp.summary);
      }
    })
    .catch(console.error);
}
