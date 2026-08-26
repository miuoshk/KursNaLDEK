"use client";

import { useTranslations } from "next-intl";
import type { ExamReadinessSnapshot } from "@/features/session/summaryTypes";

export function ExamReadinessCard({
  readiness,
}: {
  readiness: ExamReadinessSnapshot;
}) {
  const t = useTranslations("session");

  return (
    <div className="rounded-card border border-brand-gold/20 bg-brand-gold/[0.04] p-5">
      <p className="font-body text-body-xs uppercase tracking-widest text-brand-gold/80">
        {t("summaryExamReadiness")}
      </p>
      <p className="mt-2 font-heading text-3xl font-bold text-brand-gold">
        {Math.round(readiness.score)}%
      </p>
      {readiness.verdict ? (
        <p className="mt-1 font-body text-body-sm text-secondary">
          {readiness.verdict}
        </p>
      ) : null}
      <p className="mt-3 font-body text-body-xs text-muted">
        {t("summaryDailyRecommendation", {
          count: readiness.dailyRecommendation,
        })}
      </p>
    </div>
  );
}
