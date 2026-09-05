import type { SessionMode } from "@/features/session/types";

export type SessionStudyPhase = "choose" | "awaiting_confidence" | "feedback";

export function sessionStudyPhase(input: {
  mode: SessionMode;
  selectedOptionId: string | null;
  isShowingFeedback: boolean;
  isCurrentAnswered: boolean;
}): SessionStudyPhase {
  if (input.isShowingFeedback || input.isCurrentAnswered) return "feedback";
  if (input.mode === "inteligentna" && input.selectedOptionId != null) {
    return "awaiting_confidence";
  }
  return "choose";
}

export function isWaitingForConfidencePhase(
  phase: SessionStudyPhase,
): boolean {
  return phase === "awaiting_confidence";
}
