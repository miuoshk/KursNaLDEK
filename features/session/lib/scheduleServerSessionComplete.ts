import { completeSession } from "@/features/session/api/completeSession";
import { persistSessionSummaryToStorage } from "@/features/session/lib/sessionSummaryStorage";

/** Po nawigacji na podsumowanie — uzupełnij dane z serwera w tle. */
export function scheduleServerSessionComplete(
  sessionId: string,
  sessionStartMs: number,
): void {
  const dur = Math.floor((Date.now() - sessionStartMs) / 1000);
  void completeSession({ sessionId, durationSecondsFallback: dur }).then((comp) => {
    if (comp.ok) {
      persistSessionSummaryToStorage(sessionId, comp.summary);
    }
  });
}
