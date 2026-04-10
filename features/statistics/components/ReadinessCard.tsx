"use client";

import type { StatisticsPayload } from "@/features/statistics/types";

export function ReadinessCard({ data }: { data: StatisticsPayload }) {
  const pct =
    data.predictedReadiness != null
      ? Math.round(data.predictedReadiness * 100)
      : null;
  const margin = Math.round(data.readinessMargin * 100);

  return (
    <div className="rounded-card bg-card p-6">
      <p className="font-body text-body-xs font-medium uppercase tracking-wide text-secondary">
        Przewidywana gotowość
      </p>
      <p className="mt-3 font-body text-4xl text-brand-gold">
        {pct != null ? `${pct}%` : "—%"}
      </p>
      {pct != null ? (
        <p className="mt-1 font-body text-body-xs text-muted">±{margin}%</p>
      ) : (
        <p className="mt-1 font-body text-body-xs text-muted">Brak danych</p>
      )}
      <p className="mt-4 font-body text-body-xs text-muted">
        Lepszy od X% użytkowników — Niedostępne
      </p>
    </div>
  );
}
