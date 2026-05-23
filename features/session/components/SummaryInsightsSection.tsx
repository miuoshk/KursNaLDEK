"use client";

import { Brain, Lightbulb, Target, TrendingUp } from "lucide-react";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { cn } from "@/lib/utils";

type Props = {
  summary: SessionSummaryData;
  loading?: boolean;
  failed?: boolean;
  onRetry?: () => void;
};

function InsightRow({
  icon: Icon,
  children,
  accent = "gold",
}: {
  icon: typeof Lightbulb;
  children: React.ReactNode;
  accent?: "gold" | "sage";
}) {
  return (
    <li className="flex gap-3">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          accent === "gold" ? "text-brand-gold" : "text-brand-sage",
        )}
        aria-hidden
      />
      <span className="font-body text-body-sm text-secondary">{children}</span>
    </li>
  );
}

export function SummaryInsightsSection({
  summary,
  loading,
  failed,
  onRetry,
}: Props) {
  const insights = summary.sessionInsights;
  const readiness = summary.examReadiness;
  const showInteligentna = summary.mode === "inteligentna";

  if (!showInteligentna) return null;

  const hasTips =
    insights?.nextSessionFocus ||
    insights?.calibrationTip ||
    insights?.fatigueWarning ||
    (insights?.leechesHit?.length ?? 0) > 0 ||
    (insights?.retrievabilityGain ?? 0) > 0.01;

  const hasContent = Boolean(readiness || insights || loading || failed);

  if (!hasContent) return null;

  const showAccuracyFallback =
    insights != null && !hasTips && !readiness && !loading && !failed;

  return (
    <section className="rounded-card border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Brain className="size-5 text-brand-sage" aria-hidden />
        <h2 className="font-heading text-heading-sm text-primary">
          Analiza ANTARES
        </h2>
        {loading ? (
          <span className="ml-auto font-body text-body-xs text-muted">
            Analizuję sesję…
          </span>
        ) : null}
      </div>

      {loading && !readiness && !insights ? (
        <div className="mt-4 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ) : failed ? (
        <div className="mt-4">
          <p className="font-body text-body-sm text-secondary">
            Nie udało się wczytać analizy. Spróbuj ponownie za chwilę.
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-button bg-brand-sage px-4 py-2 font-body text-body-sm text-primary transition-opacity hover:opacity-90"
            >
              Odśwież analizę
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <ul className="space-y-3">
            {showAccuracyFallback ? (
              <InsightRow icon={TrendingUp} accent="sage">
                Trafność w tej sesji: {Math.round((insights!.accuracy ?? summary.accuracy) * 100)}%
                {insights!.avgTimeSeconds > 0
                  ? ` · średnio ${Math.round(insights!.avgTimeSeconds)} s na pytanie`
                  : null}
              </InsightRow>
            ) : null}
            {insights?.nextSessionFocus ? (
              <InsightRow icon={Target} accent="sage">
                {insights.nextSessionFocus}
              </InsightRow>
            ) : null}
            {insights?.calibrationTip ? (
              <InsightRow icon={Lightbulb}>{insights.calibrationTip}</InsightRow>
            ) : null}
            {insights?.fatigueWarning ? (
              <InsightRow icon={Lightbulb}>{insights.fatigueWarning}</InsightRow>
            ) : null}
            {(insights?.leechesHit?.length ?? 0) > 0 ? (
              <InsightRow icon={Target} accent="sage">
                Pijawki w tej sesji: {insights!.leechesHit.length} — warto
                powtórzyć je osobno.
              </InsightRow>
            ) : null}
            {(insights?.retrievabilityGain ?? 0) > 0.01 ? (
              <InsightRow icon={TrendingUp} accent="sage">
                Wzrost retrievability w sesji: +
                {Math.round((insights!.retrievabilityGain ?? 0) * 100)}%
              </InsightRow>
            ) : null}
          </ul>

          {readiness ? (
            <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/[0.04] p-4">
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
    </section>
  );
}
