"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { buildSessionStartHref } from "@/features/session/lib/sessionCount";
import { persistRetryWrongIds } from "@/features/session/lib/retryWrongStorage";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

export function SummaryActions({ summary }: { summary: SessionSummaryData }) {
  const router = useRouter();
  const wrongIds = summary.answers
    .filter((a) => !a.isCorrect)
    .map((a) => a.questionId);

  const nextSessionHref = buildSessionStartHref({
    subject: summary.subjectId,
    topic: summary.topicId,
    mode: summary.mode,
    count: summary.totalQuestions,
  });

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
    <div className="flex flex-wrap items-center justify-end gap-4">
      <Link
        href={nextSessionHref}
        className="rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
      >
        Rozpocznij kolejną sesję
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={handleRetryWrong}
          disabled={wrongIds.length === 0}
          title={wrongIds.length === 0 ? "Brak błędnych odpowiedzi" : undefined}
          className="rounded-btn border border-brand-sage bg-transparent px-6 py-3 font-body font-medium text-brand-sage transition duration-200 ease-out hover:border-brand-gold hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-brand-sage disabled:hover:text-brand-sage"
        >
          Powtórz błędne pytania{wrongIds.length > 0 ? ` (${wrongIds.length})` : ""}
        </button>
      </div>

      <Link
        href={`/przedmioty/${encodeURIComponent(summary.subjectId)}`}
        className="font-body text-body-sm text-secondary transition-colors duration-200 ease-out hover:text-primary"
      >
        Wróć do przedmiotu
      </Link>
    </div>
  );
}
