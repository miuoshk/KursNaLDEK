import type { SessionQuestion } from "@/features/session/types";

/** Przenosi wskazane pytanie na początek listy (deep-link z zapisanych). */
export function placeFocusQuestionFirst(
  questions: SessionQuestion[],
  focusQuestionId?: string,
): SessionQuestion[] {
  if (!focusQuestionId) return questions;
  const idx = questions.findIndex((q) => q.id === focusQuestionId);
  if (idx < 0) return questions;
  if (idx === 0) return questions;
  const focus = questions[idx];
  return [focus, ...questions.slice(0, idx), ...questions.slice(idx + 1)];
}
