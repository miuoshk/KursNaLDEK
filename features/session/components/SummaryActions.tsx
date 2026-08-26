"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  buildSessionStartHref,
  DEFAULT_SESSION_COUNT,
} from "@/features/session/lib/sessionCount";
import { persistRetryWrongIds } from "@/features/session/lib/retryWrongStorage";
import { getSummaryVariant } from "@/features/session/lib/summaryVariant";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { cn } from "@/lib/utils";

function startIdsSession(
  questionIds: string[],
  summary: SessionSummaryData,
  router: ReturnType<typeof useRouter>,
) {
  const key = persistRetryWrongIds(questionIds);
  const q = new URLSearchParams({
    subject: summary.subjectId,
    mode: summary.mode === "osce_topic" ? "inteligentna" : summary.mode,
    count: String(questionIds.length),
    retry: key,
  });
  if (summary.topicId) q.set("topic", summary.topicId);
  router.push(`/sesja/new?${q.toString()}`);
}

export function startConceptReviewSession(
  questionIds: string[],
  summary: SessionSummaryData,
  router: ReturnType<typeof useRouter>,
) {
  startIdsSession(questionIds, summary, router);
}

export function SummaryActions({
  summary,
  placement,
}: {
  summary: SessionSummaryData;
  placement: "primary" | "footer";
}) {
  const t = useTranslations("session");
  const router = useRouter();
  const variant = getSummaryVariant(summary);
  const wrongIds = summary.answers
    .filter((a) => !a.isCorrect)
    .map((a) => a.questionId);
  const answered = summary.answers.length;
  const finishCount =
    answered < summary.totalQuestions
      ? summary.totalQuestions
      : DEFAULT_SESSION_COUNT;
  const nextHref = buildSessionStartHref({
    subject: summary.subjectId,
    mode: summary.mode === "osce_topic" ? "inteligentna" : summary.mode,
    count: finishCount,
    topic: summary.topicId,
  });

  const handleRetryWrong = useCallback(() => {
    startIdsSession(wrongIds, summary, router);
  }, [wrongIds, summary, router]);

  let kind: "finish" | "retry" | "next" = "next";
  if (variant === "micro") {
    kind = "finish";
  } else if (wrongIds.length > 0) {
    kind = "retry";
  }

  const label =
    kind === "finish"
      ? t("summaryFinishFullSession")
      : kind === "retry"
        ? t("summaryRecommendedRetry", { count: wrongIds.length })
        : t("summaryNextSession");

  const className = cn(
    "inline-flex items-center justify-center rounded-btn bg-brand-gold font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110",
    placement === "primary" ? "px-8 py-4 text-body-md" : "px-6 py-3",
  );

  const control =
    kind === "retry" ? (
      <button type="button" onClick={handleRetryWrong} className={className}>
        {label}
      </button>
    ) : (
      <Link href={nextHref} className={className}>
        {label}
      </Link>
    );

  if (placement === "primary") {
    return <div className="flex justify-start">{control}</div>;
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <p className="font-body text-body-xs uppercase tracking-widest text-muted">
        {t("summaryRecommendedNext")}
      </p>
      {control}
      <Link
        href={`/przedmioty/${encodeURIComponent(summary.subjectId)}`}
        className="font-body text-body-sm text-secondary transition-colors duration-200 ease-out hover:text-primary"
      >
        {t("backToSubject")}
      </Link>
    </div>
  );
}
