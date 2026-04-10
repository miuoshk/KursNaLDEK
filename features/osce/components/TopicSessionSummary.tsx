"use client";

import Link from "next/link";
import { useMemo } from "react";

export type ResultRow = {
  questionId: string;
  label: string;
  isCorrect: boolean;
};

export type TopicSessionSummaryProps = {
  results: ResultRow[];
  onRetryWrong: () => void;
  hasWrong: boolean;
  nextTopicHref: string | null;
  stationHref: string;
};

export function TopicSessionSummary({
  results,
  onRetryWrong,
  hasWrong,
  nextTopicHref,
  stationHref,
}: TopicSessionSummaryProps) {
  const correctCount = useMemo(
    () => results.filter((r) => r.isCorrect).length,
    [results],
  );
  const pct =
    results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  return (
    <div className="rounded-card border border-border bg-card p-6">
      <h2 className="font-heading text-heading-sm text-primary">Podsumowanie</h2>
      <p className="mt-3 font-body text-body-lg text-secondary">
        Wynik:{" "}
        <span className="font-mono text-primary tabular-nums">
          {correctCount} / {results.length}
        </span>{" "}
        prawidłowych ({pct}%)
      </p>

      <ul className="mt-6 space-y-2 border-t border-white/[0.06] pt-6">
        {results.map((r) => (
          <li
            key={r.questionId}
            className="flex gap-3 font-body text-body-sm text-secondary"
          >
            <span className="shrink-0 font-mono text-primary" aria-hidden>
              {r.isCorrect ? "✓" : "✗"}
            </span>
            <span>{r.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {hasWrong ? (
          <button
            type="button"
            onClick={() => void onRetryWrong()}
            className="rounded-btn border border-brand-sage/50 bg-transparent px-6 py-3 font-body font-semibold text-brand-sage transition hover:bg-brand-sage/10"
          >
            Powtórz błędne
          </button>
        ) : null}
        {nextTopicHref ? (
          <Link
            href={nextTopicHref}
            className="inline-flex items-center justify-center rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
          >
            Następny topik
          </Link>
        ) : null}
        <Link
          href={stationHref}
          className="inline-flex items-center justify-center rounded-btn border border-white/[0.12] bg-transparent px-6 py-3 font-body font-semibold text-primary transition hover:bg-white/[0.06]"
        >
          Wróć do stacji
        </Link>
      </div>
    </div>
  );
}
