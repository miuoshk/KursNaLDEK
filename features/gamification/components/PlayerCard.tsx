"use client";

import { Clock, Flame, MessageSquare, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { RankProgressBar } from "@/features/gamification/components/RankProgressBar";
import { getCurrentRank } from "@/features/gamification/lib/ranks";
import type { GamificationPayload } from "@/features/gamification/types";
import { formatSessionDuration } from "@/features/session/lib/formatSessionDuration";
import { formatStreakI18n } from "@/lib/formatStreak";
import { cn } from "@/lib/utils";

export function PlayerCard({
  xp,
  displayName,
  initials,
  avatarEmoji,
  streak,
  totalQuestionsAnswered,
  avgAccuracy,
  totalStudyMinutes,
}: Pick<
  GamificationPayload,
  | "xp"
  | "displayName"
  | "initials"
  | "avatarEmoji"
  | "streak"
  | "totalQuestionsAnswered"
  | "avgAccuracy"
  | "totalStudyMinutes"
>) {
  const t = useTranslations("gamification");
  const tCommon = useTranslations("common");
  const rank = getCurrentRank(xp);
  const rankName = t(`ranks.${rank.id}`);
  const pct = Math.round(avgAccuracy * 100);
  const studySeconds = totalStudyMinutes * 60;

  return (
    <div className="rounded-card border border-brand-gold/20 bg-card p-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto] lg:items-center">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start lg:flex-col">
          <div
            className={cn(
              "flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-accent-2",
              avatarEmoji ? "text-3xl" : "font-body text-xl text-brand-gold",
            )}
          >
            {avatarEmoji ?? initials}
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-heading-md text-primary">{displayName}</h2>
            <p className={cn("mt-1 font-body text-body-md", rank.colorClass)}>{rankName}</p>
            <div className="mt-4">
              <RankProgressBar xp={xp} />
            </div>
          </div>
        </div>

        <div className="space-y-3 font-body text-body-sm text-secondary">
          <p className="flex items-center gap-2">
            <MessageSquare className="size-4 shrink-0 text-brand-gold" aria-hidden />
            <span>{t("player.questionsSolved", { count: totalQuestionsAnswered })}</span>
          </p>
          <p className="flex items-center gap-2">
            <Target className="size-4 shrink-0 text-brand-gold" aria-hidden />
            <span>{t("player.avgAccuracy", { pct })}</span>
          </p>
          <p className="flex items-center gap-2">
            <Flame className="size-4 shrink-0 text-brand-gold" aria-hidden />
            <span>{t("player.streak", { streak: formatStreakI18n(tCommon, streak) })}</span>
          </p>
          <p className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-brand-gold" aria-hidden />
            <span>
              {t("player.totalStudyTime", {
                duration: formatSessionDuration(studySeconds),
              })}
            </span>
          </p>
        </div>

        <div className="mr-2 flex flex-col items-center gap-1.5 lg:items-end">
          <p className="font-body text-body-xs uppercase tracking-wide text-brand-gold/60">
            {t("player.rankLabel")}
          </p>
          <div
            className={cn(
              "flex size-20 items-center justify-center rounded-full border-2 font-heading text-2xl",
              rank.colorClass,
              "border-current",
            )}
            aria-hidden
          >
            {rankName.charAt(0)}
          </div>
        </div>
      </div>
    </div>
  );
}
