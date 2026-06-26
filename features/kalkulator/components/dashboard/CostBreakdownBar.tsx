"use client";

import type { CostResult } from "@/features/kalkulator/lib/costing";
import { buildCostBreakdownSegments } from "@/features/kalkulator/lib/marginTone";

type Props = {
  price: number;
  result: CostResult;
};

function formatPln(value: number) {
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CostBreakdownBar({ price, result }: Props) {
  const segments = buildCostBreakdownSegments(price, result);

  if (price <= 0 || segments.length === 0) {
    return (
      <p className="font-body text-sm text-[color:var(--k-muted)]">
        Podaj cenę procedury, żeby zobaczyć rozbicie kosztu.
      </p>
    );
  }

  return (
    <div>
      <div className="flex h-8 w-full overflow-hidden rounded-[var(--k-radius-btn)] bg-[color:var(--k-border)]">
        {segments.map((segment) => {
          const width = Math.max(0, segment.pctOfPrice);
          if (width < 0.05) return null;

          return (
            <div
              key={segment.key}
              className="h-full transition-[width] duration-200"
              style={{
                width: `${width}%`,
                backgroundColor: segment.color,
                minWidth: width > 0 ? "2px" : undefined,
              }}
              title={`${segment.label}: ${formatPln(segment.amount)} PLN (${width.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2 font-body text-sm">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: segment.color }}
              aria-hidden
            />
            <span className="text-[color:var(--k-text)]">{segment.label}</span>
            <span className="kalkulator-tabular ml-auto text-[color:var(--k-muted)]">
              {formatPln(segment.amount)} PLN · {segment.pctOfPrice.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
