export interface RankTier {
  id: string;
  name: string;
  minXp: number;
  maxXp: number;
  colorClass: string;
}

export const RANK_TIERS: RankTier[] = [
  { id: "praktykant", name: "Praktykant", minXp: 0, maxXp: 500, colorClass: "text-amber-600" },
  { id: "asystent", name: "Asystent", minXp: 500, maxXp: 1500, colorClass: "text-slate-300" },
  { id: "rezydent-1", name: "Rezydent I°", minXp: 1500, maxXp: 3000, colorClass: "text-brand-gold" },
  { id: "rezydent-2", name: "Rezydent II°", minXp: 3000, maxXp: 5000, colorClass: "text-brand-gold" },
  { id: "rezydent-3", name: "Rezydent III°", minXp: 5000, maxXp: 8000, colorClass: "text-brand-gold" },
  { id: "specjalista", name: "Specjalista", minXp: 8000, maxXp: 12000, colorClass: "text-white" },
  // Prestige tier "Mistrz LDEK" rozbity na 5 stopni, żeby pasek XP nigdy się
  // nie zatrzymywał na 100% i było po co grindować dalej. Ostatni stopień (V°)
  // ma maxXp = Infinity i jest faktycznym końcem ścieżki.
  { id: "mistrz-1", name: "Mistrz LDEK I°", minXp: 12000, maxXp: 17000, colorClass: "text-white" },
  { id: "mistrz-2", name: "Mistrz LDEK II°", minXp: 17000, maxXp: 23000, colorClass: "text-white" },
  { id: "mistrz-3", name: "Mistrz LDEK III°", minXp: 23000, maxXp: 30000, colorClass: "text-white" },
  { id: "mistrz-4", name: "Mistrz LDEK IV°", minXp: 30000, maxXp: 40000, colorClass: "text-white" },
  { id: "mistrz-5", name: "Mistrz LDEK V°", minXp: 40000, maxXp: Number.POSITIVE_INFINITY, colorClass: "text-white" },
];

export const XP_RULES = {
  CORRECT_ANSWER: 5,
  CORRECT_HARD: 10,
  STREAK_5: 15,
  SESSION_COMPLETE: 20,
  DAILY_ACTIVITY: 10,
  REVIEW_ON_TIME: 8,
} as const;

export function getCurrentRank(xp: number): RankTier {
  return (
    RANK_TIERS.find((r) => xp >= r.minXp && xp < r.maxXp) ?? RANK_TIERS[0]
  );
}

export function getNextRank(xp: number): RankTier | null {
  const i = RANK_TIERS.findIndex((r) => xp >= r.minXp && xp < r.maxXp);
  if (i < 0 || i >= RANK_TIERS.length - 1) return null;
  return RANK_TIERS[i + 1] ?? null;
}

export function getXpProgress(xp: number): {
  current: number;
  needed: number;
  percent: number;
} {
  const rank = getCurrentRank(xp);
  const current = xp - rank.minXp;
  const span = rank.maxXp - rank.minXp;
  if (!Number.isFinite(span) || span <= 0) {
    return { current, needed: 0, percent: 100 };
  }
  return {
    current,
    needed: span,
    percent: Math.min(100, (current / span) * 100),
  };
}
