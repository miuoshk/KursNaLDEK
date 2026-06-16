"use client";

import { Award, Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { formatStreakI18n } from "@/lib/formatStreak";
import { cn } from "@/lib/utils";

export function SummaryXpCard({ summary }: { summary: SessionSummaryData }) {
  const t = useTranslations("session");
  const tCommon = useTranslations("common");
  const prev = summary.previousStreakDays;
  const showArrow = prev != null && prev !== summary.newStreak;

  return (
    <div className="rounded-card border border-brand-gold/20 bg-card p-4">
      <p className="font-body text-body-md text-brand-gold">
        {t("summaryXpEarned", { xp: summary.xpEarned })}
      </p>
      <p className="mt-2 flex items-center gap-2 font-body text-body-sm text-secondary">
        <Flame className="size-4 shrink-0 text-brand-gold" aria-hidden />
        {t("summaryStreak")}{" "}
        <span className="text-primary">
          {showArrow
            ? `${formatStreakI18n(tCommon, prev!)} → ${formatStreakI18n(tCommon, summary.newStreak)}`
            : formatStreakI18n(tCommon, summary.newStreak)}
        </span>
      </p>
      {summary.achievementUnlocked ? (
        <p
          className={cn(
            "mt-3 flex items-center gap-2 font-body text-body-sm text-secondary",
          )}
        >
          <Award className="size-4 shrink-0 text-brand-gold" aria-hidden />
          {t("summaryAchievement", { name: summary.achievementUnlocked })}
        </p>
      ) : null}
    </div>
  );
}
