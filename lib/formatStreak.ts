/** Odmiana „dzień / dni” dla liczby dni streaku (uproszczona). */
export function formatStreak(days: number): string {
  if (days <= 0) return "0 dni";
  if (days === 1) return "1 dzień";
  if (days >= 2 && days <= 4) return `${days} dni`;
  return `${days} dni`;
}
