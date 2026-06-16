"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useDashboardUser } from "@/features/shared/contexts/DashboardUserContext";
import { buildSessionStartHref } from "@/features/session/lib/sessionCount";
import { cn } from "@/lib/utils";
import type { StatisticsPayload } from "@/features/statistics/types";

export function WeakTopicsList({ data }: { data: StatisticsPayload }) {
  const t = useTranslations("statistics");
  const { preferredSessionCount } = useDashboardUser();
  if (data.weakTopics.length === 0) {
    return (
      <p className="rounded-card border border-border bg-card p-6 font-body text-body-sm text-muted">
        {t("weakTopics.empty")}
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {data.weakTopics.map((topic, i) => (
        <li
          key={topic.topicId}
          className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-card px-4 py-3"
        >
          <span className="font-body text-body-sm text-muted">{i + 1}.</span>
          <span className="min-w-0 flex-1 font-body text-body-sm font-medium text-primary">
            {topic.topicName}
          </span>
          <span
            className={cn(
              "font-body text-body-sm",
              topic.accuracy < 0.5 ? "text-error" : "text-secondary",
            )}
          >
            {Math.round(topic.accuracy * 100)}%
          </span>
          <Link
            href={buildSessionStartHref({
              subject: topic.subjectId,
              topic: topic.topicId,
              mode: "inteligentna",
              count: preferredSessionCount,
            })}
            className="rounded-btn border border-brand-sage px-3 py-1.5 font-body text-body-xs font-medium text-brand-sage transition-colors hover:bg-brand-sage/10"
          >
            {t("weakTopics.review")}
          </Link>
        </li>
      ))}
    </ol>
  );
}
