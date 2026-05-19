"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { AdminFinanceCohortRow } from "@/features/admin/server/loadAdminFinance";
import { cn } from "@/lib/utils";

type SortField = "trackLabel" | "year" | "totalUsers" | "paidActiveUsers" | "paidPct";
type SortDir = "asc" | "desc";

export function AdminPaidPctTable({ rows }: { rows: AdminFinanceCohortRow[] }) {
  const [sortBy, setSortBy] = useState<SortField>("paidPct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const dirMul = sortDir === "asc" ? 1 : -1;
      if (sortBy === "trackLabel") {
        return a.trackLabel.localeCompare(b.trackLabel, "pl") * dirMul;
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
            <SortableTh label="Kierunek" field="trackLabel" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Rok" field="year" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Wszyscy" field="totalUsers" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Płacący" field="paidActiveUsers" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="% płacących" field="paidPct" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center font-body text-body-sm text-muted">
                Brak danych kohort z subskrypcjami.
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={`${row.trackKey}-${row.year}`} className="border-b border-border transition-colors hover:bg-white/[0.02]">
                <td className="px-3 py-3 font-body text-body-sm text-primary">{row.trackLabel}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">Rok {row.year}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">{row.totalUsers}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">{row.paidActiveUsers}</td>
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
                  <div className="flex items-center gap-2">
                    <span>{row.paidPct}%</span>
                    <span className="h-1.5 w-24 rounded-full bg-white/5">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          row.paidPct >= 30
                            ? "bg-success"
                            : row.paidPct < 10
                              ? "bg-muted"
                              : "bg-brand-gold",
                        )}
                        style={{ width: `${Math.min(100, row.paidPct)}%` }}
                      />
                    </span>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
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
