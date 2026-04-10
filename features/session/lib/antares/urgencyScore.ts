/**
 * Pilność powtórki due: wyższa wartość = ważniejsze pytanie w kolejce.
 * Łączy ryzyko zapomnienia (niska retrievability), przeterminowanie terminu `next_review`,
 * słabość tematu i korekcję za leech (depriorytetyzacja).
 */
export function calculateDueUrgency(input: {
  retrievability: number;
  nextReviewAt: Date | string;
  topicMasteryScore?: number;
  isLeech?: boolean;
  now?: Date;
}): number {
  const now = input.now ?? new Date();
  const due =
    typeof input.nextReviewAt === "string"
      ? new Date(input.nextReviewAt)
      : input.nextReviewAt;
  const ms = now.getTime() - due.getTime();
  const daysOverdue = ms > 0 ? ms / 86_400_000 : 0;

  const r = Math.min(1, Math.max(0, input.retrievability));
  const retrievabilityUrgency = 1 - r;

  const overdueFactor = Math.min(1.5, daysOverdue / 30);

  const mastery = input.topicMasteryScore ?? 0.5;
  const weaknessBoost = (1 - mastery) * 0.3;

  const leechFactor = input.isLeech ? 0.7 : 1.0;

  const raw =
    (retrievabilityUrgency * 0.5 + overdueFactor * 0.3 + weaknessBoost * 0.2) *
    leechFactor;

  return Math.min(1, Math.max(0, raw));
}
