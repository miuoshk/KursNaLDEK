"use client";

import { Award, Flame } from "lucide-react";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { formatStreak } from "@/lib/formatStreak";
import { cn } from "@/lib/utils";

export function SummaryXpCard({ summary }: { summary: SessionSummaryData }) {
  const prev = summary.previousStreakDays;
  const showArrow = prev != null && prev !== summary.newStreak;

  return (
    <div className="rounded-card border border-brand-gold/20 bg-card p-4">
      <p className="font-mono text-body-md text-brand-gold">
        +{summary.xpEarned} XP za tę sesję
      </p>
      <p className="mt-2 flex items-center gap-2 font-body text-body-sm text-secondary">
        <Flame className="size-4 shrink-0 text-brand-gold" aria-hidden />
        Streak:{" "}
        <span className="text-primary">
          {showArrow
            ? `${formatStreak(prev!)} → ${formatStreak(summary.newStreak)}`
            : formatStreak(summary.newStreak)}
        </span>
      </p>
      {summary.achievementUnlocked ? (
        <p
          className={cn(
            "mt-3 flex items-center gap-2 font-body text-body-sm text-secondary",
          )}
        >
          <Award className="size-4 shrink-0 text-brand-gold" aria-hidden />
          Nowe osiągnięcie: {summary.achievementUnlocked}
        </p>
      ) : null}
    </div>
  );
}
