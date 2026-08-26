"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Flame,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { formatSessionDuration } from "@/features/session/lib/formatSessionDuration";
import { sessionModeLabel } from "@/features/session/lib/sessionModeLabel";
import {
  canComparePreviousSession,
  getSummaryVariant,
  pickVerdictMessageKeys,
} from "@/features/session/lib/summaryVariant";
import { cn } from "@/lib/utils";

const R = 52;
const C = 2 * Math.PI * R;

type Props = {
  summary: SessionSummaryData;
  insightsLoading?: boolean;
  insightsFailed?: boolean;
  onInsightsRetry?: () => void;
  primaryCta?: ReactNode;
};

type SummaryTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function pickHeadline(
  sessionId: string,
  variant: ReturnType<typeof getSummaryVariant>,
  t: SummaryTranslator,
): { title: string; subtitle: string } {
  const keys = pickVerdictMessageKeys(sessionId, variant);
  return {
    title: t(keys.titleKey),
    subtitle: t(keys.subtitleKey),
  };
}

function InsightRow({
  icon: Icon,
  children,
}: {
  icon: typeof Lightbulb;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-brand-sage" aria-hidden />
      <span className="font-body text-body-sm text-secondary">{children}</span>
    </li>
  );
}

function SummaryInsightsFooter({
  summary,
  loading,
  failed,
  onRetry,
}: {
  summary: SessionSummaryData;
  loading?: boolean;
  failed?: boolean;
  onRetry?: () => void;
}) {
  const t = useTranslations("session");
  const tCommon = useTranslations("common");
  const variant = getSummaryVariant(summary);
  const insights = summary.sessionInsights;
  const fatigueText =
    insights?.fatigueWarning === "fatigue_detected"
      ? t("fatigueSummary")
      : insights?.fatigueWarning;

  if (variant === "micro") return null;

  const retrievabilityGain = insights?.retrievabilityGain ?? 0;
  const showRetrievability = Math.abs(retrievabilityGain) >= 0.01;
  const retrievabilityPercent = Math.round(retrievabilityGain * 100);

  const tips = [
    insights?.calibrationTip,
    fatigueText,
    (insights?.leechesHit?.length ?? 0) > 0
      ? t("summaryLeeches", { count: insights!.leechesHit.length })
      : null,
  ].filter(Boolean) as string[];

  const showFooter =
    summary.mode === "inteligentna" &&
    (loading || failed || showRetrievability || tips.length > 0);

  if (!showFooter) return null;

  return (
    <div className="mt-8 border-t border-white/[0.08] pt-6">
      {loading && !showRetrievability && tips.length === 0 ? (
        <div className="space-y-2">
          <p className="font-body text-body-xs text-muted">
            {t("summaryRecalculating")}
          </p>
          <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ) : failed && !showRetrievability && tips.length === 0 ? (
        <div>
          <p className="font-body text-body-sm text-secondary">
            {t("summaryInsightsFailed")}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-button bg-brand-sage px-4 py-2 font-body text-body-sm text-primary transition-opacity hover:opacity-90"
            >
              {tCommon("refresh")}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {showRetrievability ? (
            <div>
              <p className="flex items-center gap-2 font-body text-body-sm text-primary">
                <TrendingUp className="size-4 shrink-0 text-brand-sage" aria-hidden />
                {t("summaryRetrievability", {
                  percent:
                    retrievabilityPercent > 0
                      ? `+${retrievabilityPercent}`
                      : String(retrievabilityPercent),
                })}
              </p>
              <p className="mt-1.5 font-body text-body-xs text-muted">
                {t("summaryRetrievabilityCaption")}
              </p>
            </div>
          ) : null}
          {tips.length > 0 ? (
            <ul className="space-y-3">
              {insights?.calibrationTip ? (
                <InsightRow icon={Lightbulb}>
                  {insights.calibrationTip}
                </InsightRow>
              ) : null}
              {fatigueText ? (
                <InsightRow icon={Lightbulb}>{fatigueText}</InsightRow>
              ) : null}
              {(insights?.leechesHit?.length ?? 0) > 0 ? (
                <InsightRow icon={RotateCcw}>
                  {t("summaryLeeches", { count: insights!.leechesHit.length })}
                </InsightRow>
              ) : null}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function SummaryHero({
  summary,
  insightsLoading,
  insightsFailed,
  onInsightsRetry,
  primaryCta,
}: Props) {
  const t = useTranslations("session");
  const variant = getSummaryVariant(summary);
  const showCompare = canComparePreviousSession(summary);
  const prev = summary.previousAccuracy;
  const delta =
    showCompare && prev != null
      ? Math.round((summary.accuracy - prev) * 100)
      : null;
  const improved = delta != null && delta > 0;
  const declined = delta != null && delta < 0;
  const answered = summary.answers.length;
  const planned = summary.totalQuestions;
  const questionsLine = t("summaryQuestionsOf", {
    answered: answered < planned ? answered : planned,
    total: planned,
    questionsLabel: t("questionsShort"),
  });
  const headline = pickHeadline(summary.sessionId, variant, (key) =>
    t(key as never),
  );
  const dailyPlan = summary.dailyPlan;
  const title = headline.title;
  const subtitle = headline.subtitle;
  const ringN = Math.max(answered, 1);
  const ringCorrect = summary.correctAnswers;
  const ringProgress = ringN > 0 ? ringCorrect / ringN : 0;
  const ringPercent = answered > 0 ? Math.round((ringCorrect / answered) * 100) : 0;

  return (
    <div className="rounded-card border-t-[3px] border-brand-gold bg-card p-5 md:p-8">
      <div className="min-w-0">
        <h1 className="font-heading text-[24px] leading-tight text-primary md:text-[30px]">
          {title}
        </h1>
        <p className="mt-2 font-body text-[15px] leading-relaxed text-secondary md:text-[16px]">
          {subtitle}
        </p>
        <p className="mt-4 font-body text-body-xs text-muted">
          {summary.subjectName} · {sessionModeLabel(summary.mode, t)} ·{" "}
          {questionsLine} · {formatSessionDuration(summary.durationSeconds)}
          {dailyPlan
            ? ` · ${t("summaryDailyPlanMinutes", {
                completed: dailyPlan.completedMinutesToday,
                target: dailyPlan.targetMinutes,
              })}`
            : null}
        </p>
        {showCompare && prev != null && delta != null ? (
          <p className="mt-2 flex flex-wrap items-center gap-1 font-body text-body-xs text-secondary">
            <span>{t("summaryPreviousSession")} </span>
            <span>{Math.round(prev * 100)}%</span>
            {delta !== 0 ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5",
                  improved && "text-success",
                  declined && "text-error",
                )}
              >
                ({improved ? "+" : ""}
                {delta} pp)
                {improved ? (
                  <TrendingUp className="size-3.5" aria-hidden />
                ) : declined ? (
                  <TrendingDown className="size-3.5" aria-hidden />
                ) : null}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      {primaryCta ? <div className="mt-6">{primaryCta}</div> : null}

      <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center">
          <div className="relative size-[120px]">
            <svg className="size-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="10"
              />
              <motion.circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke="var(--brand-gold)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                initial={{ strokeDashoffset: C }}
                animate={{ strokeDashoffset: C * (1 - ringProgress) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-body text-[28px] font-medium leading-none text-brand-gold md:text-[32px]">
                {t("summaryRingPercent", { percent: ringPercent })}
              </span>
            </div>
          </div>
          <p className="mt-2 font-body text-body-sm text-secondary">
            {t("summaryRingCaption", {
              correct: ringCorrect,
              total: answered,
            })}
          </p>
        </div>

        <ul className="flex flex-1 flex-wrap gap-x-6 gap-y-3 text-body-sm">
          {summary.durationSeconds > 0 ? (
            <li className="flex items-center gap-2">
              <Clock className="size-4 shrink-0 text-secondary" aria-hidden />
              <span className="font-body text-primary">
                {t("summaryTime", {
                  duration: formatSessionDuration(summary.durationSeconds),
                })}
              </span>
            </li>
          ) : null}
          {summary.avgTimePerQuestion > 0 ? (
            <li className="flex items-center gap-2">
              <Timer className="size-4 shrink-0 text-secondary" aria-hidden />
              <span className="font-body text-primary">
                {t("summaryAvgPerQuestion", {
                  duration: formatSessionDuration(summary.avgTimePerQuestion),
                })}
              </span>
            </li>
          ) : null}
          {summary.longestStreak > 0 ? (
            <li className="flex items-center gap-2">
              <Flame
                className={cn(
                  "size-4 shrink-0",
                  summary.longestStreak >= 5
                    ? "text-brand-gold"
                    : "text-secondary",
                )}
                aria-hidden
              />
              <span className="font-body text-primary">
                {t("summaryLongestStreak", { count: summary.longestStreak })}
              </span>
            </li>
          ) : null}
          {summary.newQuestionsCount > 0 ? (
            <li className="flex items-center gap-2">
              <Sparkles className="size-4 shrink-0 text-secondary" aria-hidden />
              <span className="font-body text-primary">
                {t("summaryNewQuestions", { count: summary.newQuestionsCount })}
              </span>
            </li>
          ) : null}
          {summary.reviewCount > 0 ? (
            <li className="flex items-center gap-2">
              <RotateCcw className="size-4 shrink-0 text-secondary" aria-hidden />
              <span className="font-body text-primary">
                {t("summaryReviews", { count: summary.reviewCount })}
              </span>
            </li>
          ) : null}
        </ul>
      </div>

      <SummaryInsightsFooter
        summary={summary}
        loading={insightsLoading}
        failed={insightsFailed}
        onRetry={onInsightsRetry}
      />
    </div>
  );
}
