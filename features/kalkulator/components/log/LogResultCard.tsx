"use client";

import { cn } from "@/lib/utils";
import { getMarginTone, marginToneColor } from "@/features/kalkulator/lib/marginTone";
import type { LogResultSummary } from "@/features/kalkulator/types/log";

type Props = {
  procedureName: string;
  summary: LogResultSummary;
  onLogAnother: () => void;
  kiosk?: boolean;
};

function formatPln(value: number) {
  return value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function LogResultCard({ procedureName, summary, onLogAnother, kiosk = false }: Props) {
  const tone = getMarginTone(summary.marginPct);

  return (
    <div
      className={cn(
        "rounded-[var(--k-radius-card)] border border-[color:var(--k-primary-light)]/40 bg-[color:var(--k-primary)]/5",
        kiosk ? "p-8" : "p-6",
      )}
    >
      <p className="font-body text-xs uppercase tracking-wide text-[color:var(--k-muted)]">
        Zapisano wykonanie
      </p>
      <h2
        className={cn(
          "mt-2 font-heading text-[color:var(--k-primary)]",
          kiosk ? "text-3xl" : "text-2xl",
        )}
      >
        {procedureName}
      </h2>

      <p
        className={cn(
          "mt-6 font-body text-[color:var(--k-text)]",
          kiosk ? "text-xl" : "text-base",
        )}
      >
        Ta wizyta: przychód{" "}
        <span className="kalkulator-tabular font-semibold">{formatPln(summary.revenue)} PLN</span>
        , koszt{" "}
        <span className="kalkulator-tabular font-semibold">{formatPln(summary.totalCost)} PLN</span>
        , marża{" "}
        <span
          className="kalkulator-tabular font-semibold"
          style={{ color: marginToneColor(tone) }}
        >
          {summary.marginPct.toLocaleString("pl-PL")}%
        </span>
      </p>

      <p className="mt-2 font-body text-sm text-[color:var(--k-muted)]">
        Marża w PLN:{" "}
        <span className="kalkulator-tabular font-medium">{formatPln(summary.marginPln)} PLN</span>
      </p>

      <button
        type="button"
        onClick={onLogAnother}
        className={cn(
          "mt-8 rounded-[var(--k-radius-btn)] bg-[color:var(--k-accent)] font-body font-semibold text-[color:var(--k-text)] transition hover:brightness-105",
          kiosk ? "px-8 py-4 text-lg" : "px-6 py-3 text-sm",
        )}
      >
        Zaloguj kolejną wizytę
      </button>
    </div>
  );
}
