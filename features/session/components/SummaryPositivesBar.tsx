"use client";

import { Flame, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import {
  getSummaryVariant,
  isSummaryLayer2Ready,
} from "@/features/session/lib/summaryVariant";

function formatPositivePp(delta: number, locale: string): string {
  const rounded = Math.round(delta * 10) / 10;
  const abs = Math.abs(rounded);
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: abs % 1 === 0 ? 0 : 1,
  }).format(abs);
  return `+${formatted} p.p.`;
}

export function SummaryPositivesBar({
  summary,
  insightsLoading,
}: {
  summary: SessionSummaryData;
  insightsLoading?: boolean;
}) {
  const t = useTranslations("session");
  const locale = useLocale();
  const variant = getSummaryVariant(summary);
  const layer2 = isSummaryLayer2Ready(summary);
  const streak = summary.newStreak;
  const xp = summary.xpEarned;
  const showStreak = layer2 && streak > 0;
  const showXp = xp > 0;
  const before = summary.examReadinessBefore;
  const after = summary.examReadiness?.score;
  const showReadiness = variant !== "micro" && typeof after === "number";
  const readinessDelta =
    showReadiness && typeof before === "number" ? after - before : null;
  const showPositiveDelta = readinessDelta != null && readinessDelta > 0;

  if (!layer2) {
    return (
      <div className="flex flex-wrap gap-3" aria-hidden>
        <div className="h-10 w-36 animate-pulse rounded-pill bg-white/[0.06]" />
        <div className="h-10 w-24 animate-pulse rounded-pill bg-white/[0.06]" />
      </div>
    );
  }

  const showReadinessSkeleton =
    variant !== "micro" &&
    insightsLoading &&
    summary.mode === "inteligentna" &&
    !showReadiness;

  if (!showStreak && !showXp && !showReadiness && !showReadinessSkeleton) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-3">
      {showStreak ? (
        <li className="inline-flex items-center gap-2 rounded-pill border border-brand-gold/20 bg-card px-4 py-2 font-body text-body-sm text-primary">
          <Flame className="size-4 shrink-0 text-brand-gold" aria-hidden />
          {t("summaryPositivesStreak", { count: streak })}
        </li>
      ) : null}
      {showXp ? (
        <li className="inline-flex items-center gap-2 rounded-pill border border-white/[0.08] bg-card px-4 py-2 font-body text-body-sm text-primary">
          <Sparkles className="size-4 shrink-0 text-brand-gold" aria-hidden />
          {t("summaryXpEarned", { xp })}
        </li>
      ) : null}
      {showReadiness ? (
        <li className="inline-flex items-center gap-2 rounded-pill border border-white/[0.08] bg-card px-4 py-2 font-body text-body-sm text-primary">
          {showPositiveDelta
            ? t("summaryReadinessDeltaPositive", {
                score: Math.round(after),
                delta: formatPositivePp(readinessDelta, locale),
              })
            : t("summaryReadinessLevel", { score: Math.round(after) })}
        </li>
      ) : null}
      {showReadinessSkeleton ? (
        <li
          className="h-10 w-56 animate-pulse rounded-pill bg-white/[0.06]"
          aria-hidden
        />
      ) : null}
    </ul>
  );
}
