"use client";

import type { StatisticsPayload } from "@/features/statistics/types";

const MIN_USER_ATTEMPTS = 20;
const MIN_COHORT_SIZE = 5;

function peerLabel(data: StatisticsPayload): string {
  if (data.peerPercentile != null) {
    const rounded = Math.round(data.peerPercentile);
    return `Lepszy od ${rounded}% użytkowników w Twojej kohorcie`;
  }
  if (data.peerUserAttempts < MIN_USER_ATTEMPTS) {
    const remaining = MIN_USER_ATTEMPTS - data.peerUserAttempts;
    return `Rozwiąż jeszcze ${remaining} ${
      remaining === 1 ? "pytanie" : "pytań"
    }, żeby porównać z innymi`;
  }
  if (data.peerCohortSize < MIN_COHORT_SIZE) {
    return "Za mało osób w Twojej kohorcie, żeby porównać";
  }
  return "Porównanie z innymi niedostępne";
}

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
      <p className="mt-4 font-body text-body-xs text-muted">{peerLabel(data)}</p>
    </div>
  );
}
