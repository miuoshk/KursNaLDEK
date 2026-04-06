import type { AnswerState } from "@/features/session/components/AnswerOption";
import type { SessionQuestion } from "@/features/session/types";

export function optionVisualState(
  optId: string,
  q: SessionQuestion,
  isShowingFeedback: boolean,
  selectedOptionId: string | null,
): AnswerState {
  if (!isShowingFeedback) {
    return selectedOptionId === optId ? "selected" : "default";
  }
  if (optId === q.correctOptionId) return "correct";
  if (optId === selectedOptionId) return "wrong";
  return "muted";
}
