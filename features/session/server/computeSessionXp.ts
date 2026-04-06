import { XP_RULES } from "@/features/gamification/lib/ranks";

export function computeSessionXp(
  rows: { is_correct: boolean; difficulty: string }[],
  totalQuestionsInSession: number,
): number {
  let xp = 0;
  for (const r of rows) {
    if (r.is_correct) {
      xp += XP_RULES.CORRECT_ANSWER;
      if (r.difficulty === "trudne") {
        xp += XP_RULES.CORRECT_HARD - XP_RULES.CORRECT_ANSWER;
      }
    }
  }

  let best = 0;
  let cur = 0;
  for (const r of rows) {
    if (r.is_correct) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  if (best >= 5) xp += XP_RULES.STREAK_5;

  if (totalQuestionsInSession >= 10 && rows.length > 0) {
    xp += XP_RULES.SESSION_COMPLETE;
  }

  return xp;
}
