"use client";

import { useTranslations } from "next-intl";
import { BrainCircuit } from "lucide-react";
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
  const t = useTranslations("session");
  const concepts = summary.strengthenedConcepts ?? [];

  if (concepts.length > 0) {
    return (
      <section className="space-y-4">
        <h2 className="font-heading text-heading-sm text-primary">
          {t("summaryStrengthenedConcepts")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {concepts.map((concept) => (
            <li
              key={concept.conceptId}
              className="flex items-start gap-3 rounded-card bg-card p-4"
            >
              <BrainCircuit
                className="mt-0.5 size-5 shrink-0 text-brand-sage"
                aria-hidden
              />
              <div>
                <p className="font-body text-body-md font-medium text-primary">
                  {concept.label}
                </p>
                <p className="mt-1 font-body text-body-xs text-muted">
                  {t("summaryConceptAttempts", {
                    attempts: concept.attempts,
                    correct: concept.correct,
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-heading-sm text-primary">
        {t("summaryTopicBreakdown")}
      </h2>
      <ul className="space-y-3">
        {summary.topicBreakdown.map((topic) => (
          <li key={topic.topicName} className="rounded-card bg-card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="min-w-0 flex-1 font-body text-body-md font-medium text-primary">
                {topic.topicName}
              </span>
              <div className="h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn(
                    "h-full rounded-full",
                    barColor(topic.accuracy),
                  )}
                  style={{ width: `${Math.round(topic.accuracy * 100)}%` }}
                />
              </div>
              <span className="font-body text-body-sm text-secondary">
                {topic.correct} / {topic.total} (
                {Math.round(topic.accuracy * 100)}%)
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
