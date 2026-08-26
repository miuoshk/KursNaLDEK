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
import {
  getSummaryVariant,
  resolveSummaryFooterActions,
  type SummaryFooterAction,
} from "@/features/session/lib/summaryVariant";
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
  if (summary.sourceFilter && summary.sourceFilter !== "all") {
    q.set("src", summary.sourceFilter);
  }
  router.push(`/sesja/new?${q.toString()}`);
}

export function startConceptReviewSession(
  questionIds: string[],
  summary: SessionSummaryData,
  router: ReturnType<typeof useRouter>,
) {
  startIdsSession(questionIds, summary, router);
}

function sessionStartMode(summary: SessionSummaryData) {
  return summary.mode === "osce_topic" ? "inteligentna" : summary.mode;
}

function nextSessionHref(summary: SessionSummaryData): string {
  return buildSessionStartHref({
    subject: summary.subjectId,
    mode: sessionStartMode(summary),
    count: Math.max(summary.totalQuestions, 1),
    topic: summary.topicId,
    src: summary.sourceFilter,
  });
}

function finishSessionHref(
  summary: SessionSummaryData,
  answered: number,
): string {
  const count =
    answered < summary.totalQuestions
      ? summary.totalQuestions
      : DEFAULT_SESSION_COUNT;
  return buildSessionStartHref({
    subject: summary.subjectId,
    mode: sessionStartMode(summary),
    count,
    topic: summary.topicId,
    src: summary.sourceFilter,
  });
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
  const finishHref = finishSessionHref(summary, answered);
  const nextHref = nextSessionHref(summary);

  const handleRetryWrong = useCallback(() => {
    startIdsSession(wrongIds, summary, router);
  }, [wrongIds, summary, router]);

  const labelFor = (kind: SummaryFooterAction, footer: boolean) => {
    if (kind === "finish") return t("summaryFinishFullSession");
    if (kind === "retry") {
      return t("summaryRecommendedRetry", { count: wrongIds.length });
    }
    return footer ? t("summaryFooterNextSession") : t("summaryNextSession");
  };

  const renderControl = (
    kind: SummaryFooterAction,
    weight: "primary" | "secondary",
    footer: boolean,
  ) => {
    const className = cn(
      "inline-flex items-center justify-center rounded-btn font-body font-semibold transition duration-200 ease-out",
      weight === "primary" &&
        "bg-brand-gold text-brand-bg hover:brightness-110",
      weight === "secondary" &&
        "border border-white/20 bg-transparent text-primary hover:bg-white/[0.05]",
      placement === "primary"
        ? "w-full px-8 py-4 text-body-md sm:w-auto"
        : "px-6 py-3",
    );
    const label = labelFor(kind, footer);
    if (kind === "retry") {
      return (
        <button type="button" onClick={handleRetryWrong} className={className}>
          {label}
        </button>
      );
    }
    const href = kind === "finish" ? finishHref : nextHref;
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  };

  if (placement === "primary") {
    const { primary } = resolveSummaryFooterActions(variant, wrongIds.length);
    return (
      <div className="flex justify-start">
        {renderControl(primary, "primary", false)}
      </div>
    );
  }

  const footer = resolveSummaryFooterActions(variant, wrongIds.length);

  return (
    <div className="flex flex-col items-start gap-3 sm:items-end">
      <div className="flex flex-row flex-wrap items-center gap-3">
        {renderControl(footer.primary, "primary", true)}
        {footer.secondary
          ? renderControl(footer.secondary, "secondary", true)
          : null}
      </div>
      <Link
        href={`/przedmioty/${encodeURIComponent(summary.subjectId)}`}
        className="font-body text-body-sm text-secondary transition-colors duration-200 ease-out hover:text-primary"
      >
        {t("backToSubject")}
      </Link>
    </div>
  );
}
