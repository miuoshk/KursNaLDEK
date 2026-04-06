"use client";

import { motion } from "framer-motion";
import { Clock, Flame, RotateCcw, Sparkles, Timer, TrendingDown, TrendingUp } from "lucide-react";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { formatSessionDuration } from "@/features/session/lib/formatSessionDuration";
import { sessionModeLabel } from "@/features/session/lib/sessionModeLabel";
import { cn } from "@/lib/utils";

const R = 52;
const C = 2 * Math.PI * R;

export function SummaryHero({ summary }: { summary: SessionSummaryData }) {
  const prev = summary.previousAccuracy;
  const delta =
    prev != null ? Math.round((summary.accuracy - prev) * 100) : null;
  const improved = delta != null && delta > 0;
  const declined = delta != null && delta < 0;
  const answered = summary.answers.length;
  const planned = summary.totalQuestions;
  const questionsLabel =
    answered < planned ? `${answered} z ${planned} pytań` : `${planned} pytań`;

  return (
    <div className="rounded-card border-t-[3px] border-brand-gold bg-brand-card-1 p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-heading-lg text-white">Sesja zakończona</p>
          <p className="mt-2 font-body text-body-sm text-secondary">
            {summary.subjectName} · Tryb: {sessionModeLabel(summary.mode)} · {questionsLabel} ·{" "}
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
              <span className="font-mono text-4xl text-brand-gold">
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
                      "inline-flex items-center gap-0.5 font-mono",
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
            <span className="font-mono text-white">
              Czas: {formatSessionDuration(summary.durationSeconds)}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Timer className="size-4 shrink-0 text-secondary" aria-hidden />
            <span className="font-mono text-white">
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
            <span className="font-mono text-white">
              Seria bez błędu: {summary.longestStreak}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-secondary" aria-hidden />
            <span className="font-mono text-white">
              Nowe pytania: {summary.newQuestionsCount}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <RotateCcw className="size-4 shrink-0 text-secondary" aria-hidden />
            <span className="font-mono text-white">Powtórki: {summary.reviewCount}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
