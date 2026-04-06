"use client";

import { getNextRank, getXpProgress } from "@/features/gamification/lib/ranks";

export function RankProgressBar({ xp }: { xp: number }) {
  const { current, needed, percent } = getXpProgress(xp);
  const next = getNextRank(xp);

  return (
    <div className="w-full max-w-md">
      <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full rounded-full bg-brand-gold transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-body-xs text-muted">
        {next
          ? `${current} / ${needed} XP do następnego poziomu`
          : "Maksymalny poziom rangi"}
      </p>
    </div>
  );
}
