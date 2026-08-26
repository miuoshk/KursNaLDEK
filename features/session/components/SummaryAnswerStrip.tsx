"use client";

import { useMemo, useState } from "react";
import { CheckCircle, ChevronDown, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";
import {
  SUMMARY_WRONG_FILTER_MIN_N,
  summaryQuestionSnippet,
} from "@/features/session/lib/summaryVariant";
import { cn } from "@/lib/utils";

type AnswerRow = SessionSummaryData["answers"][0];
type RowStatus = "correct" | "wrong" | "lucky" | "unanswered";

function rowStatus(a: AnswerRow | undefined): RowStatus {
  if (!a) return "unanswered";
  if (a.isCorrect && a.confidence === "nie_wiedzialem") return "lucky";
  if (a.isCorrect) return "correct";
  return "wrong";
}

function statusDot(status: RowStatus) {
  if (status === "correct") return "bg-success";
  if (status === "wrong") return "bg-error";
  if (status === "lucky") return "bg-brand-gold";
  return "border border-white/20 bg-transparent";
}

export function SummaryAnswerStrip({
  summary,
}: {
  summary: SessionSummaryData;
}) {
  const t = useTranslations("session");
  const tCommon = useTranslations("common");
  const [wrongOnly, setWrongOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const answers = summary.answers;
  const unansweredCount = Math.max(0, summary.totalQuestions - answers.length);
  const present = useMemo(() => {
    const set = new Set<RowStatus>();
    for (const a of answers) set.add(rowStatus(a));
    if (unansweredCount > 0) set.add("unanswered");
    return set;
  }, [answers, unansweredCount]);

  const visible = useMemo(() => {
    if (!wrongOnly) return answers;
    return answers.filter((a) => !a.isCorrect);
  }, [answers, wrongOnly]);

  const scorePercent = Math.round(summary.accuracy * 100);
  const passThreshold = 60;
  const isPassed = scorePercent >= passThreshold;
  const missingPercent = Math.max(0, passThreshold - scorePercent);
  const isOsceSession =
    summary.mode === "osce_topic" || summary.mode.toLowerCase().includes("osce");
  const showWrongFilter = answers.length >= SUMMARY_WRONG_FILTER_MIN_N;

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
              <CheckCircle
                className="mt-0.5 size-4 shrink-0 text-green-400"
                aria-hidden
              />
            ) : (
              <XCircle
                className="mt-0.5 size-4 shrink-0 text-red-400"
                aria-hidden
              />
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

      <h2 className="font-heading text-heading-sm text-primary">
        {t("summarySessionFlow")}
      </h2>

      <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-card border border-border bg-card">
        {visible.map((a) => {
          const status = rowStatus(a);
          const open = openId === a.questionId;
          return (
            <li key={a.questionId}>
              <button
                type="button"
                onClick={() =>
                  setOpenId(open ? null : a.questionId)
                }
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-200 ease-out hover:bg-white/[0.04]"
              >
                <span
                  className={cn(
                    "mt-1.5 size-2.5 shrink-0 rounded-full",
                    statusDot(status),
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 font-body text-body-sm text-primary">
                  {summaryQuestionSnippet(a.questionText)}
                </span>
                <ChevronDown
                  className={cn(
                    "mt-0.5 size-4 shrink-0 text-muted transition-transform duration-200 ease-out",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
                <span className="sr-only">
                  {open ? t("summaryCollapseQuestion") : t("summaryExpandQuestion")}
                </span>
              </button>
              {open ? (
                <div className="space-y-3 border-t border-white/[0.06] bg-background/40 px-4 py-3">
                  <p className="font-body text-body-sm text-primary">
                    {a.questionText}
                  </p>
                  <p className="font-body text-body-sm text-secondary">
                    {t("summaryYourAnswerShort", {
                      selected: a.selectedOptionText,
                    })}
                  </p>
                  <p className="font-body text-body-sm text-secondary">
                    {t("summaryCorrectAnswerLabel", {
                      correct: a.correctOptionText,
                    })}
                  </p>
                  {a.explanation ? (
                    <div>
                      <p className="font-body text-body-xs font-medium uppercase tracking-widest text-muted">
                        {tCommon("explanation")}
                      </p>
                      <div className="mt-2">{markdownBlock(a.explanation)}</div>
                    </div>
                  ) : null}
                  <p className="font-body text-body-xs text-muted">
                    {a.topicName}
                    {a.timeSpentSeconds > 0
                      ? ` · ${a.timeSpentSeconds}s`
                      : ""}
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-4 font-body text-body-xs text-muted">
        {present.has("correct") ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" aria-hidden />
            {t("summaryCorrect")}
          </span>
        ) : null}
        {present.has("wrong") ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-error" aria-hidden />
            {t("summaryWrong")}
          </span>
        ) : null}
        {present.has("lucky") ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand-gold" aria-hidden />
            {t("summaryLuckyGuess")}
          </span>
        ) : null}
        {present.has("unanswered") ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full border border-white/20"
              aria-hidden
            />
            {t("summaryUnanswered")}
          </span>
        ) : null}
      </div>

      {showWrongFilter ? (
        <label className="flex cursor-pointer items-center gap-2 font-body text-body-sm text-secondary">
          <input
            type="checkbox"
            className="size-4 rounded border-border bg-background"
            checked={wrongOnly}
            onChange={(e) => setWrongOnly(e.target.checked)}
          />
          {t("summaryShowWrongOnly")}
        </label>
      ) : null}
    </section>
  );
}
