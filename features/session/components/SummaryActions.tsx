"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { persistRetryWrongIds } from "@/features/session/lib/retryWrongStorage";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

export function SummaryActions({ summary }: { summary: SessionSummaryData }) {
  const router = useRouter();
  const wrongIds = summary.answers
    .filter((a) => !a.isCorrect)
    .map((a) => a.questionId);

  const handleRetryWrong = useCallback(() => {
    const key = persistRetryWrongIds(wrongIds);
    router.push(
      `/sesja/new?subject=${encodeURIComponent(summary.subjectId)}&mode=inteligentna&count=${wrongIds.length}&retry=${encodeURIComponent(key)}`,
    );
  }, [wrongIds, summary.subjectId, router]);

  return (
    <div className="flex flex-wrap items-center justify-end gap-4">
      <Link
        href={`/sesja/new?subject=${encodeURIComponent(summary.subjectId)}&mode=inteligentna&count=10`}
        className="rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
      >
        Rozpocznij kolejną sesję
      </Link>

      {wrongIds.length > 0 ? (
        <button
          type="button"
          onClick={handleRetryWrong}
          className="rounded-btn border border-brand-sage bg-transparent px-6 py-3 font-body font-medium text-brand-sage transition duration-200 ease-out hover:border-brand-gold hover:text-brand-gold"
        >
          Powtórz błędne pytania ({wrongIds.length})
        </button>
      ) : null}

      <Link
        href={`/przedmioty/${encodeURIComponent(summary.subjectId)}`}
        className="font-body text-body-sm text-secondary transition-colors duration-200 ease-out hover:text-white"
      >
        Wróć do przedmiotu
      </Link>
    </div>
  );
}
