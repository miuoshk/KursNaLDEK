"use client";

import { motion } from "framer-motion";
import { Clock, Flame, RotateCcw, Sparkles, Timer, TrendingDown, TrendingUp } from "lucide-react";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { formatSessionDuration } from "@/features/session/lib/formatSessionDuration";
import { sessionModeLabel } from "@/features/session/lib/sessionModeLabel";
import { cn } from "@/lib/utils";
import { pytaniaForm } from "@/lib/pluralizePolish";

const R = 52;
const C = 2 * Math.PI * R;

/**
 * Dynamiczny nagłówek + jednolinijkowy komentarz, dobrany do (accuracy, delta).
 * Cel: zamiast suchego "Sesja zakończona" dostajemy emocjonalny feedback,
 * spójny z motywem marki (dyskretny, bez emoji). Pomaga utrwalić nawyk -
 * pochwała przy progresie, łagodne reframing przy spadkach.
 */
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
      title: "Sesja zakończona",
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
    title: "Sesja zakończona",
    subtitle: "Każda runda przybliża Cię do mistrzostwa. Powtórka pomoże.",
  };
}

export function SummaryHero({ summary }: { summary: SessionSummaryData }) {
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
          <p className="font-body text-body-xs uppercase tracking-[0.2em] text-brand-gold/80">
            Sesja zakończona
          </p>
          <p className="mt-2 font-heading text-heading-lg text-primary">{title}</p>
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
    </div>
  );
}
