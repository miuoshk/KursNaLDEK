"use client";

import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { cn } from "@/lib/utils";

function barColor(acc: number) {
  if (acc < 0.4) return "bg-error";
  if (acc <= 0.75) return "bg-brand-gold";
  return "bg-success";
}

export function SummaryTopicBreakdown({
  summary,
}: {
  summary: SessionSummaryData;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-heading-sm text-primary">
        Wyniki według tematów
      </h2>
      <ul className="space-y-3">
        {summary.topicBreakdown.map((t) => (
          <li
            key={t.topicName}
            className="rounded-card bg-brand-card-1 p-4"
          >
            <div className="flex flex-wrap items-center gap-4">
              <span className="min-w-0 flex-1 font-body text-body-md font-medium text-primary">
                {t.topicName}
              </span>
              <div className="h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn("h-full rounded-full", barColor(t.accuracy))}
                  style={{ width: `${Math.round(t.accuracy * 100)}%` }}
                />
              </div>
              <span className="font-mono text-body-sm text-secondary">
                {t.correct} / {t.total} ({Math.round(t.accuracy * 100)}%)
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
