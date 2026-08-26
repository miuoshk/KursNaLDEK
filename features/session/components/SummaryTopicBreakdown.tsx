"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import {
  isSummaryLayer2Ready,
  splitSessionConcepts,
} from "@/features/session/lib/summaryVariant";
import { startConceptReviewSession } from "@/features/session/components/SummaryActions";
import { SummaryStatusMark } from "@/features/session/components/SummaryStatusMark";
import { cn } from "@/lib/utils";

function capitalizeFirst(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return label;
  return trimmed.charAt(0).toLocaleUpperCase("pl") + trimmed.slice(1);
}

function ConceptsSkeleton() {
  return (
    <section className="space-y-4" aria-hidden>
      <div className="h-5 w-48 animate-pulse rounded bg-white/[0.06]" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="h-20 animate-pulse rounded-card bg-white/[0.06]"
          />
        ))}
      </ul>
    </section>
  );
}

export function SummaryTopicBreakdown({
  summary,
}: {
  summary: SessionSummaryData;
}) {
  const t = useTranslations("session");
  const router = useRouter();
  const layer2 = isSummaryLayer2Ready(summary);

  if (!layer2) {
    return <ConceptsSkeleton />;
  }

  const concepts = summary.strengthenedConcepts ?? [];
  if (concepts.length > 0) {
    const { mastered, review } = splitSessionConcepts(concepts);
    return (
      <div className="space-y-8">
        {mastered.length > 0 ? (
          <section className="space-y-4">
            <h2 className="font-heading text-heading-sm text-primary">
              {t("summaryMasteredConcepts")}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {mastered.map((concept) => (
                <li
                  key={concept.conceptId}
                  className="flex items-start gap-3 rounded-card bg-card p-4"
                >
                  <SummaryStatusMark status="correct" className="mt-0.5" />
                  <div>
                    <p className="font-body text-body-md font-medium text-primary">
                      {concept.label}
                    </p>
                    <p className="mt-1 font-body text-body-xs text-muted">
                      {t("summaryConceptScore", {
                        correct: concept.correct,
                        attempts: concept.attempts,
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {review.length > 0 ? (
          <section className="space-y-4">
            <h2 className="font-heading text-heading-sm text-primary">
              {t("summaryConceptsToReview")}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {review.map((concept) => {
                const ids = concept.questionIds ?? [];
                return (
                  <li
                    key={concept.conceptId}
                    className="flex items-start gap-3 rounded-card bg-card p-4"
                  >
                    <SummaryStatusMark status="wrong" className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-body-md font-medium text-primary">
                        {capitalizeFirst(concept.label)}
                      </p>
                      <p className="mt-1 font-body text-body-xs text-muted">
                        {t("summaryConceptScore", {
                          correct: concept.correct,
                          attempts: concept.attempts,
                        })}
                      </p>
                      {ids.length > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            startConceptReviewSession(ids, summary, router)
                          }
                          className="mt-2 font-body text-body-sm text-brand-gold transition-colors duration-200 ease-out hover:text-primary"
                        >
                          {t("summaryRepeatConcept")}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  if (summary.topicBreakdown.length === 0) return null;

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
                    topic.accuracy < 0.4
                      ? "bg-error"
                      : topic.accuracy <= 0.75
                        ? "bg-brand-gold"
                        : "bg-success",
                  )}
                  style={{ width: `${Math.round(topic.accuracy * 100)}%` }}
                />
              </div>
              <span className="font-body text-body-sm text-secondary">
                {topic.correct}/{topic.total}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
