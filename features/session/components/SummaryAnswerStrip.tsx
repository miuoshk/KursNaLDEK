"use client";

import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { CheckCircle, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { cn } from "@/lib/utils";

function stripBg(a: SessionSummaryData["answers"][0]) {
  if (a.isCorrect && a.confidence === "nie_wiedzialem") return "bg-brand-gold";
  if (a.isCorrect) return "bg-success";
  return "bg-error";
}

export function SummaryAnswerStrip({ summary }: { summary: SessionSummaryData }) {
  const t = useTranslations("session");
  const [wrongOnly, setWrongOnly] = useState(false);
  const wrong = useMemo(
    () => summary.answers.filter((a) => !a.isCorrect),
    [summary.answers],
  );
  const totalSlots = summary.totalQuestions;
  const answers = summary.answers;
  const scorePercent = Math.round(summary.accuracy * 100);
  const passThreshold = 60;
  const isPassed = scorePercent >= passThreshold;
  const missingPercent = Math.max(0, passThreshold - scorePercent);
  const isOsceSession =
    summary.mode === "osce_topic" || summary.mode.toLowerCase().includes("osce");

  const tooltipLine = (
    i: number,
    a: SessionSummaryData["answers"][0],
  ) =>
    t("summaryTooltip", {
      index: i + 1,
      result: a.isCorrect ? t("summaryCorrect") : t("summaryWrong"),
      seconds: a.timeSpentSeconds,
      topic: a.topicName,
    });

  return (
    <section className="space-y-4">
      {isOsceSession ? (
        <div
          className={cn(
            "rounded-lg border p-3",
            isPassed
              ? "border-green-500/20 bg-green-500/10"
              : "border-red-500/20 bg-red-500/10",
          )}
        >
          <div className="flex items-start gap-2">
            {isPassed ? (
              <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-400" aria-hidden />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden />
            )}
            <div>
              <p
                className={cn(
                  "font-body text-sm font-bold",
                  isPassed ? "text-green-400" : "text-red-400",
                )}
              >
                {isPassed ? t("summaryOscePassed") : t("summaryOsceFailed")}
              </p>
              <p
                className={cn(
                  "mt-1 font-body text-xs",
                  isPassed ? "text-green-400/60" : "text-red-400/60",
                )}
              >
                {isPassed
                  ? t("summaryOscePassedDetail", {
                      score: scorePercent,
                      threshold: passThreshold,
                    })
                  : t("summaryOsceFailedDetail", {
                      score: scorePercent,
                      missing: missingPercent,
                    })}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <h2 className="font-heading text-heading-sm text-primary">{t("summarySessionFlow")}</h2>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: totalSlots }, (_, i) => {
          const a = answers[i];
          if (a) {
            return (
              <Tooltip key={a.questionId}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex size-8 items-center justify-center rounded-sm font-body text-body-xs text-white/80",
                      stripBg(a),
                    )}
                  >
                    {i + 1}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs rounded-btn border border-border bg-card px-3 py-2 font-body text-body-xs text-primary"
                >
                  {tooltipLine(i, a)}
                </TooltipContent>
              </Tooltip>
            );
          }
          return (
            <div
              key={`empty-${i}`}
              className="flex size-8 items-center justify-center rounded-sm border border-dashed border-border font-body text-body-xs text-muted"
              aria-hidden
            >
              {i + 1}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 font-body text-body-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-success" aria-hidden />
          {t("summaryCorrect")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-error" aria-hidden />
          {t("summaryWrong")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand-gold" aria-hidden />
          {t("summaryLuckyGuess")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full border border-white/20" aria-hidden />
          {t("summaryUnanswered")}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 font-body text-body-sm text-secondary">
          <input
            type="checkbox"
            className="size-4 rounded border-border bg-background"
            checked={wrongOnly}
            onChange={(e) => setWrongOnly(e.target.checked)}
          />
          {t("summaryShowWrongOnly")}
        </label>
      </div>

      {wrongOnly && wrong.length > 0 ? (
        <ul className="space-y-3 rounded-card border border-border bg-background/40 p-4">
          {wrong.map((a) => (
            <li key={a.questionId} className="font-body text-body-sm text-secondary">
              <p className="text-primary">{a.questionText}</p>
              <p className="mt-1">
                {t("summaryYourAnswer", {
                  selected: a.selectedOptionText,
                  correct: a.correctOptionText,
                  topic: a.topicName,
                })}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
