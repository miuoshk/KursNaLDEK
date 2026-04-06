"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { StatisticsPayload } from "@/features/statistics/types";

export function WeakTopicsList({ data }: { data: StatisticsPayload }) {
  if (data.weakTopics.length === 0) {
    return (
      <p className="rounded-card border border-[color:var(--border-subtle)] bg-brand-card-1 p-6 font-body text-body-sm text-muted">
        Odpowiedz na więcej pytań, aby zidentyfikować słabe obszary.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {data.weakTopics.map((t, i) => (
        <li
          key={t.topicId}
          className="flex flex-wrap items-center gap-3 rounded-card border border-[color:var(--border-subtle)] bg-brand-card-1 px-4 py-3"
        >
          <span className="font-mono text-body-sm text-muted">{i + 1}.</span>
          <span className="min-w-0 flex-1 font-body text-body-sm font-medium text-primary">
            {t.topicName}
          </span>
          <span
            className={cn(
              "font-mono text-body-sm",
              t.accuracy < 0.5 ? "text-error" : "text-secondary",
            )}
          >
            {Math.round(t.accuracy * 100)}%
          </span>
          <Link
            href={`/sesja/new?subject=${encodeURIComponent(t.subjectId)}&topic=${encodeURIComponent(t.topicId)}&mode=inteligentna&count=10`}
            className="rounded-btn border border-brand-sage px-3 py-1.5 font-body text-body-xs font-medium text-brand-sage transition-colors hover:bg-brand-sage/10"
          >
            Powtórz
          </Link>
        </li>
      ))}
    </ol>
  );
}
