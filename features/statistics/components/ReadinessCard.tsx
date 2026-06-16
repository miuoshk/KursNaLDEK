"use client";

import { useTranslations } from "next-intl";
import type { StatisticsPayload } from "@/features/statistics/types";

const MIN_USER_ATTEMPTS = 20;
const MIN_COHORT_SIZE = 5;

function peerLabel(
  t: ReturnType<typeof useTranslations<"statistics">>,
  data: StatisticsPayload,
): string {
  if (data.peerPercentile != null) {
    const rounded = Math.round(data.peerPercentile);
    return t("readiness.peerBetter", { pct: rounded });
  }
  if (data.peerUserAttempts < MIN_USER_ATTEMPTS) {
    const remaining = MIN_USER_ATTEMPTS - data.peerUserAttempts;
    return t("readiness.peerNeedMore", { count: remaining });
  }
  if (data.peerCohortSize < MIN_COHORT_SIZE) {
    return t("readiness.peerCohortSmall");
  }
  return t("readiness.peerUnavailable");
}

export function ReadinessCard({ data }: { data: StatisticsPayload }) {
  const t = useTranslations("statistics");
  const pct =
    data.predictedReadiness != null
      ? Math.round(data.predictedReadiness * 100)
      : null;
  const margin = Math.round(data.readinessMargin * 100);

  return (
    <div className="rounded-card bg-card p-6">
      <p className="font-body text-body-xs font-medium uppercase tracking-wide text-secondary">
        {t("readiness.title")}
      </p>
      <p className="mt-3 font-body text-4xl text-brand-gold">
        {pct != null ? `${pct}%` : "—%"}
      </p>
      {pct != null ? (
        <p className="mt-1 font-body text-body-xs text-muted">{t("readiness.margin", { margin })}</p>
      ) : (
        <p className="mt-1 font-body text-body-xs text-muted">{t("readiness.noData")}</p>
      )}
      <p className="mt-4 font-body text-body-xs text-muted">{peerLabel(t, data)}</p>
    </div>
  );
}
