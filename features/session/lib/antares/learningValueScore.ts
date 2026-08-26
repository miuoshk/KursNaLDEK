export type LearningValueScoreInput = {
  retrievability: number;
  mastery: number;
  averageTimeSeconds: number | null;
  source?: string;
  repeatCount?: number;
  isLeech?: boolean;
  overdueDays?: number;
  isNew?: boolean;
  /** Jawny sygnał użytkownika (np. zapisane pytanie z tego pojęcia), max +15%. */
  conceptPrioritySignal?: number;
};

/**
 * Wartość nauki na sekundę:
 * ryzyko zapomnienia × znaczenie egzaminacyjne × słabość pojęcia ÷ czas.
 */
export function calculateLearningValueScore(
  input: LearningValueScoreInput,
): number {
  const retrievability = Math.min(1, Math.max(0, input.retrievability));
  const mastery = Math.min(1, Math.max(0, input.mastery));
  const risk = input.isNew ? 0.55 : Math.max(0.05, 1 - retrievability);
  const overdueMultiplier =
    1 + Math.min(1, Math.max(0, input.overdueDays ?? 0) / 30);
  const sourceMultiplier =
    input.source === "cem" || input.source === "lek" || input.source === "ldek"
      ? 1.25
      : 1;
  const recurrenceMultiplier =
    1 + Math.min(0.5, Math.max(0, input.repeatCount ?? 0) * 0.08);
  const weaknessMultiplier = 0.6 + (1 - mastery) * 0.8;
  const leechMultiplier = input.isLeech ? 1.2 : 1;
  const conceptPriorityMultiplier =
    1 + Math.min(0.15, Math.max(0, input.conceptPrioritySignal ?? 0) * 0.15);
  const timeCost = Math.min(180, Math.max(15, input.averageTimeSeconds ?? 45));

  return (
    (100 *
      risk *
      overdueMultiplier *
      sourceMultiplier *
      recurrenceMultiplier *
      weaknessMultiplier *
      leechMultiplier *
      conceptPriorityMultiplier) /
    timeCost
  );
}
