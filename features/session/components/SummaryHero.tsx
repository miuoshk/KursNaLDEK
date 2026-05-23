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
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { formatSessionDuration } from "@/features/session/lib/formatSessionDuration";
import { sessionModeLabel } from "@/features/session/lib/sessionModeLabel";
import { cn } from "@/lib/utils";
import { pytaniaForm } from "@/lib/pluralizePolish";

const R = 52;
const C = 2 * Math.PI * R;

type Props = {
  summary: SessionSummaryData;
  insightsLoading?: boolean;
  insightsFailed?: boolean;
  onInsightsRetry?: () => void;
};

function pickHeadline(
  accuracy: number,
  delta: number | null,
): { title: string; subtitle: string } {
  const pct = Math.round(accuracy * 100);

  if (pct === 100) {
    return {
      title: "Komplet!",
      subtitle: "Wszystkie odpowiedzi poprawne. Świetna robota.",
    };
  }
  if (pct >= 90) {
    return {
      title: "Niemal idealnie",
      subtitle: "Wyjątkowo wysoka skuteczność.",
    };
  }
  if (delta != null && delta >= 15) {
    return {
      title: "Wyraźny postęp",
      subtitle: `O ${delta} punktów lepiej niż ostatnio. To się utrwala.`,
    };
  }
  if (pct >= 75) {
    return {
      title: "Solidna sesja",
      subtitle: "Materiał masz pod kontrolą — czas na trudniejsze pytania.",
    };
  }
  if (pct >= 50) {
    return {
      title: "Dobra robota",
      subtitle: "Solidna podstawa — przejrzyj błędy i wracaj jutro.",
    };
  }
  if (delta != null && delta <= -10) {
    return {
      title: "Trudniejszy materiał",
      subtitle: "Spadek skuteczności — warto wrócić do podstaw tego działu.",
    };
  }
  return {
    title: "Trzymaj tempo",
    subtitle: "Każda runda przybliża Cię do mistrzostwa. Powtórka pomoże.",
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

function SummaryInteligentnaFooter({
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
  const insights = summary.sessionInsights;
  const readiness = summary.examReadiness;

  const tips = [
    insights?.calibrationTip,
    insights?.fatigueWarning,
    (insights?.leechesHit?.length ?? 0) > 0
      ? `Pijawki w tej sesji: ${insights!.leechesHit.length} — warto powtórzyć je osobno.`
      : null,
    (insights?.retrievabilityGain ?? 0) > 0.01
      ? `Siła zapamiętania w sesji: +${Math.round((insights!.retrievabilityGain ?? 0) * 100)}%`
      : null,
  ].filter(Boolean) as string[];

  const showFooter =
    summary.mode === "inteligentna" &&
    (loading || failed || readiness || tips.length > 0);

  if (!showFooter) return null;

  return (
    <div className="mt-8 border-t border-white/[0.08] pt-6">
      {loading && !readiness && tips.length === 0 ? (
        <div className="space-y-2">
          <p className="font-body text-body-xs text-muted">Przeliczam wskazówki…</p>
          <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ) : failed && !readiness && tips.length === 0 ? (
        <div>
          <p className="font-body text-body-sm text-secondary">
            Nie udało się wczytać wskazówek. Spróbuj ponownie za chwilę.
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-button bg-brand-sage px-4 py-2 font-body text-body-sm text-primary transition-opacity hover:opacity-90"
            >
              Odśwież
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr,min(240px,100%)] lg:items-start">
          {tips.length > 0 ? (
            <ul className="space-y-3">
              {insights?.calibrationTip ? (
                <InsightRow icon={Lightbulb}>{insights.calibrationTip}</InsightRow>
              ) : null}
              {insights?.fatigueWarning ? (
                <InsightRow icon={Lightbulb}>{insights.fatigueWarning}</InsightRow>
              ) : null}
              {(insights?.leechesHit?.length ?? 0) > 0 ? (
                <InsightRow icon={RotateCcw}>
                  Pijawki w tej sesji: {insights!.leechesHit.length} — warto powtórzyć
                  je osobno.
                </InsightRow>
              ) : null}
              {(insights?.retrievabilityGain ?? 0) > 0.01 ? (
                <InsightRow icon={TrendingUp}>
                  Siła zapamiętania w sesji: +
                  {Math.round((insights!.retrievabilityGain ?? 0) * 100)}%
                </InsightRow>
              ) : null}
            </ul>
          ) : (
            <div />
          )}

          {readiness ? (
            <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/[0.04] p-4 lg:justify-self-end lg:w-full">
              <p className="font-body text-body-xs uppercase tracking-widest text-brand-gold/80">
                Gotowość egzaminacyjna
              </p>
              <p className="mt-2 font-heading text-3xl font-bold text-brand-gold">
                {Math.round(readiness.score)}%
              </p>
              <p className="mt-1 font-body text-body-sm text-secondary">
                {readiness.verdict}
              </p>
              <p className="mt-3 font-body text-body-xs text-muted">
                Rekomendacja: ok. {readiness.dailyRecommendation} pytań dziennie
              </p>
            </div>
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
}: Props) {
  const prev = summary.previousAccuracy;
  const delta =
    prev != null ? Math.round((summary.accuracy - prev) * 100) : null;
  const improved = delta != null && delta > 0;
  const declined = delta != null && delta < 0;
  const answered = summary.answers.length;
  const planned = summary.totalQuestions;
  const questionsLabel =
    answered < planned
      ? `${answered} z ${planned} ${pytaniaForm(planned)}`
      : `${planned} ${pytaniaForm(planned)}`;
  const { title, subtitle } = pickHeadline(summary.accuracy, delta);

  return (
    <div className="rounded-card border-t-[3px] border-brand-gold bg-card p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-heading-lg text-primary">{title}</h1>
          <p className="mt-1.5 font-body text-body-md text-secondary">{subtitle}</p>
          <p className="mt-4 font-body text-body-xs text-muted">
            {summary.subjectName} · {sessionModeLabel(summary.mode)} · {questionsLabel} ·{" "}
            {formatSessionDuration(summary.durationSeconds)}
          </p>
        </div>

        <div className="flex flex-col items-center sm:flex-1">
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
                animate={{ strokeDashoffset: C * (1 - summary.accuracy) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-body text-4xl text-brand-gold">
                {Math.round(summary.accuracy * 100)}%
              </span>
            </div>
          </div>
          <p className="mt-2 font-body text-body-sm text-secondary">
            Poprawnych odpowiedzi
          </p>
          <div className="mt-2 flex items-center gap-1 font-body text-body-xs">
            {prev == null ? (
              <span className="text-muted">Pierwsza sesja z tego przedmiotu</span>
            ) : (
              <>
                <span className="text-secondary">Poprzednia sesja: </span>
                <span className="text-secondary">{Math.round(prev * 100)}%</span>
                {delta !== 0 && delta != null ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-body",
                      improved && "text-success",
                      declined && "text-error",
                      !improved && !declined && "text-muted",
                    )}
                  >
                    ({improved ? "+" : ""}
                    {delta}%)
                    {improved ? (
                      <TrendingUp className="size-3.5" aria-hidden />
                    ) : declined ? (
                      <TrendingDown className="size-3.5" aria-hidden />
                    ) : null}
                  </span>
                ) : null}
              </>
            )}
          </div>
        </div>

        <ul className="flex flex-col gap-3 text-body-sm lg:w-[260px]">
          <li className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-secondary" aria-hidden />
            <span className="font-body text-primary">
              Czas: {formatSessionDuration(summary.durationSeconds)}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Timer className="size-4 shrink-0 text-secondary" aria-hidden />
            <span className="font-body text-primary">
              Średnio na pytanie: {formatSessionDuration(summary.avgTimePerQuestion)}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Flame
              className={cn(
                "size-4 shrink-0",
                summary.longestStreak >= 5 ? "text-brand-gold" : "text-secondary",
              )}
              aria-hidden
            />
            <span className="font-body text-primary">
              Seria bez błędu: {summary.longestStreak}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-secondary" aria-hidden />
            <span className="font-body text-primary">
              Nowe pytania: {summary.newQuestionsCount}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <RotateCcw className="size-4 shrink-0 text-secondary" aria-hidden />
            <span className="font-body text-primary">Powtórki: {summary.reviewCount}</span>
          </li>
        </ul>
      </div>

      <SummaryInteligentnaFooter
        summary={summary}
        loading={insightsLoading}
        failed={insightsFailed}
        onRetry={onInsightsRetry}
      />
    </div>
  );
}
