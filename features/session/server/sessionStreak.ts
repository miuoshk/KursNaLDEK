/** Logika streaku: wczoraj → +1, dziś → bez zmian, inaczej → 1 */

export function nextStreakValues(
  lastActiveDate: string | null,
  currentStreak: number,
): { streak: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = new Date(today);
  y.setDate(y.getDate() - 1);

  if (!lastActiveDate) {
    return { streak: 1 };
  }

  const last = new Date(lastActiveDate + "T12:00:00");
  last.setHours(0, 0, 0, 0);

  if (last.getTime() === today.getTime()) {
    return { streak: currentStreak };
  }
  if (last.getTime() === y.getTime()) {
    return { streak: currentStreak + 1 };
  }
  return { streak: 1 };
}

export function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
