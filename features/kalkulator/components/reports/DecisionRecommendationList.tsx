"use client";

import type { DecisionRecommendation } from "@/features/kalkulator/lib/buildDecisionRecommendation";

type Props = {
  recommendations: DecisionRecommendation[];
};

export function DecisionRecommendationList({ recommendations }: Props) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[var(--k-radius-card)] border border-[color:var(--k-accent)]/40 bg-[color:var(--k-accent)]/5 p-4">
      <h3 className="font-body text-sm font-semibold text-[color:var(--k-text)]">
        Rekomendacje decyzyjne
      </h3>
      <p className="mt-1 font-body text-xs text-[color:var(--k-muted)]">
        Konkretne kroki na podstawie benchmarków rynku (n=106) — nie tylko diagnoza.
      </p>
      <ul className="mt-4 space-y-3">
        {recommendations.map((item) => (
          <li
            key={item.procedureId}
            className="rounded-[var(--k-radius-btn)] border border-[color:var(--k-border)] bg-white px-4 py-3 font-body text-sm text-[color:var(--k-text)]"
          >
            {item.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
