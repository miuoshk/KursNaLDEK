"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { AdminCohortBenchmark } from "@/features/admin/server/loadAdminDashboard";
import { cn } from "@/lib/utils";

type SortField =
  | "label"
  | "headcount"
  | "activeCount"
  | "paidPct"
  | "avgPlatformMinutes"
  | "avgTestMinutes"
  | "avgTestDurationMinutes"
  | "avgAccuracy";

type SortDir = "asc" | "desc";

export function AdminCohortBenchmarkTable({ rows }: { rows: AdminCohortBenchmark[] }) {
  const [sortBy, setSortBy] = useState<SortField>("paidPct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const dirMul = sortDir === "asc" ? 1 : -1;
      if (sortBy === "label") {
        return a.label.localeCompare(b.label, "pl", { numeric: true }) * dirMul;
      }
      return ((a[sortBy] ?? 0) - (b[sortBy] ?? 0)) * dirMul;
    });
    return copy;
  }, [rows, sortBy, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-card">
            <SortableTh label="Kohorta" field="label" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Liczebność" field="headcount" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Aktywni (30d)" field="activeCount" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Aktywne suby" field="paidPct" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Śr. czas / user" field="avgPlatformMinutes" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Śr. czas testów" field="avgTestMinutes" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Śr. czas testu" field="avgTestDurationMinutes" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Śr. poprawność" field="avgAccuracy" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 py-8 text-center font-body text-body-sm text-muted">
                Brak danych kohort.
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={row.label} className="border-b border-border transition-colors hover:bg-white/[0.02]">
                <td className="px-3 py-3 font-body text-body-sm text-primary">{row.label}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                  {row.headcount}
                </td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                  {row.activeCount}
                </td>
                <td
                  className={cn(
                    "px-3 py-3 font-body text-body-sm tabular-nums",
                    row.paidPct >= 30
                      ? "text-success"
                      : row.paidPct < 10
                        ? "text-muted"
                        : "text-brand-gold",
                  )}
                >
                  {row.paidCount} / {row.headcount} · {row.paidPct}%
                </td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                  {formatMinutes(row.avgPlatformMinutes)}
                </td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                  {formatMinutes(row.avgTestMinutes)}
                </td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                  {row.avgTestDurationMinutes ? `${row.avgTestDurationMinutes} min` : "—"}
                </td>
                <td
                  className={cn(
                    "px-3 py-3 font-body text-body-sm tabular-nums",
                    row.avgAccuracy >= 70
                      ? "text-success"
                      : row.avgAccuracy < 50
                        ? "text-error"
                        : "text-secondary",
                  )}
                >
                  {row.avgAccuracy}%
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatMinutes(mins: number): string {
  if (!mins) return "—";
  if (mins < 60) return `${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function SortableTh({
  label,
  field,
  sortBy,
  sortDir,
  onClick,
}: {
  label: string;
  field: SortField;
  sortBy: SortField;
  sortDir: SortDir;
  onClick: (field: SortField) => void;
}) {
  const isActive = sortBy === field;
  return (
    <th className="px-3 py-3">
      <button
        type="button"
        onClick={() => onClick(field)}
        className={cn(
          "group inline-flex items-center gap-1 font-body text-body-xs uppercase tracking-widest transition-colors",
          isActive ? "text-primary" : "text-muted hover:text-secondary",
        )}
      >
        <span>{label}</span>
        {isActive ? (
          sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
        )}
      </button>
    </th>
  );
}
