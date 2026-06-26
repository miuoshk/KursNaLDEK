"use client";

import { cn } from "@/lib/utils";
import { getMarginTone, marginToneColor } from "@/features/kalkulator/lib/marginTone";
import type { ProcedureMonthStats } from "@/features/kalkulator/lib/aggregateMonthlyReport";

type Props = {
  rows: ProcedureMonthStats[];
};

function formatTrendPp(value: number | null) {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("pl-PL")} pp`;
}

function formatTrendCount(value: number | null) {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}`;
}

function ReportRowCards({ rows }: Props) {
  return (
    <ul className="kalkulator-reports-cards-wrap space-y-3">
      {rows.map((row) => {
        const tone = getMarginTone(row.avgMarginPct);
        return (
          <li
            key={row.procedureId}
            className="rounded-[var(--k-radius-card)] border border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] p-4 shadow-sm"
          >
            <p className="font-body text-sm font-semibold text-[color:var(--k-text)]">
              {row.procedureName}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 font-body text-sm">
              <div>
                <dt className="text-xs text-[color:var(--k-muted)]">Wykonania</dt>
                <dd className="kalkulator-tabular font-medium">{row.executionCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-[color:var(--k-muted)]">Śr. marża</dt>
                <dd className="kalkulator-tabular font-medium" style={{ color: marginToneColor(tone) }}>
                  {row.avgMarginPct.toLocaleString("pl-PL")}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[color:var(--k-muted)]">Suma marży</dt>
                <dd className="kalkulator-tabular font-medium">
                  {row.totalMarginPln.toLocaleString("pl-PL")} PLN
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[color:var(--k-muted)]">Trend marża</dt>
                <dd className="kalkulator-tabular font-medium">{formatTrendPp(row.marginTrendPp)}</dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}

export function ProcedureReportTable({ rows }: Props) {
  return (
    <>
      <ReportRowCards rows={rows} />

      <div className="kalkulator-reports-table-wrap overflow-hidden rounded-[var(--k-radius-card)] border border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-[color:var(--k-border)] bg-[color:var(--k-page-bg)]">
                {[
                  "Procedura",
                  "Wykonania",
                  "Śr. marża",
                  "Suma marży",
                  "Trend marża",
                  "Trend wyk.",
                ].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-4 py-2 text-left font-body text-xs font-medium uppercase tracking-wide text-[color:var(--k-muted)]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const tone = getMarginTone(row.avgMarginPct);
                return (
                  <tr key={row.procedureId} className="border-b border-[color:var(--k-border)]">
                    <th scope="row" className="px-4 py-3 text-left font-body text-sm font-normal text-[color:var(--k-text)]">
                      {row.procedureName}
                    </th>
                    <td className="kalkulator-tabular px-4 py-3 font-body text-sm">
                      {row.executionCount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="kalkulator-tabular inline-flex items-center gap-2 font-body text-sm font-medium"
                        style={{ color: marginToneColor(tone) }}
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: marginToneColor(tone) }}
                          aria-hidden
                        />
                        {row.avgMarginPct.toLocaleString("pl-PL")}%
                      </span>
                    </td>
                    <td className="kalkulator-tabular px-4 py-3 font-body text-sm">
                      {row.totalMarginPln.toLocaleString("pl-PL")} PLN
                    </td>
                    <td
                      className={cn(
                        "kalkulator-tabular px-4 py-3 font-body text-sm",
                        row.marginTrendPp != null && row.marginTrendPp > 0
                          ? "text-[color:var(--k-margin-positive)]"
                          : row.marginTrendPp != null && row.marginTrendPp < 0
                            ? "text-[color:var(--k-margin-loss)]"
                            : "text-[color:var(--k-muted)]",
                      )}
                    >
                      {formatTrendPp(row.marginTrendPp)}
                    </td>
                    <td className="kalkulator-tabular px-4 py-3 font-body text-sm text-[color:var(--k-muted)]">
                      {formatTrendCount(row.countTrend)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
