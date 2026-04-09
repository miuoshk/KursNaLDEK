/**
 * Pilność powtórki due: wyższa wartość = ważniejsze pytanie w kolejce.
 * Łączy ryzyko zapomnienia (niska retrievability) z przeterminowaniem terminu `next_review`.
 */
export function calculateDueUrgency(input: {
  retrievability: number;
  nextReviewAt: Date | string;
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
  const forget = 1 - r;
  const overdueNorm = Math.min(1, daysOverdue / 30);
  return forget * 0.65 + overdueNorm * 0.35;
}
