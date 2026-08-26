"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { buildSessionStartHref } from "@/features/session/lib/sessionCount";
import { persistRetryWrongIds } from "@/features/session/lib/retryWrongStorage";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

export function SummaryActions({ summary }: { summary: SessionSummaryData }) {
  const t = useTranslations("session");
  const router = useRouter();
  const wrongIds = summary.answers
    .filter((a) => !a.isCorrect)
    .map((a) => a.questionId);

  const fatigueDetected =
    summary.sessionInsights?.fatigueWarning === "fatigue_detected";
  const dailyPlan = summary.dailyPlan;
  const dailyRemaining = dailyPlan
    ? Math.max(
        0,
        dailyPlan.targetQuestions -
          dailyPlan.questionsTodayAtStart -
          dailyPlan.answeredQuestions,
      )
    : 0;
  const recommendation = fatigueDetected
    ? "break"
    : dailyRemaining > 0
      ? "continue_plan"
      : wrongIds.length > 0
        ? "retry"
        : "done";
  const recommendedHref =
    recommendation === "continue_plan"
      ? buildSessionStartHref({
          subject: dailyPlan?.scopeSubjectId ?? undefined,
          mode: "inteligentna",
          count: dailyRemaining,
          dailyPlan: true,
        })
      : "/pulpit";
  const recommendedLabel =
    recommendation === "break"
      ? t("summaryRecommendedBreak")
      : recommendation === "retry"
        ? t("summaryRecommendedRetry", { count: wrongIds.length })
        : recommendation === "continue_plan"
          ? t("summaryRecommendedContinuePlan", { count: dailyRemaining })
          : t("summaryRecommendedDone");

  const handleRetryWrong = useCallback(() => {
    const key = persistRetryWrongIds(wrongIds);
    const q = new URLSearchParams({
      subject: summary.subjectId,
      mode: summary.mode,
      count: String(wrongIds.length),
      retry: key,
    });
    if (summary.topicId) q.set("topic", summary.topicId);
    router.push(`/sesja/new?${q.toString()}`);
  }, [wrongIds, summary.subjectId, summary.topicId, summary.mode, router]);

  return (
    <div className="flex flex-col items-end gap-3">
      <p className="font-body text-body-xs uppercase tracking-widest text-muted">
        {t("summaryRecommendedNext")}
      </p>
      {recommendation === "retry" ? (
        <button
          type="button"
          onClick={handleRetryWrong}
          className="rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
        >
          {recommendedLabel}
        </button>
      ) : (
        <Link
          href={recommendedHref}
          className="rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
        >
          {recommendedLabel}
        </Link>
      )}

      <Link
        href={`/przedmioty/${encodeURIComponent(summary.subjectId)}`}
        className="font-body text-body-sm text-secondary transition-colors duration-200 ease-out hover:text-primary"
      >
        {t("backToSubject")}
      </Link>
    </div>
  );
}
