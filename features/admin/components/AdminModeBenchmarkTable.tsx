"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ModeRow = {
  mode: string;
  sessions: number;
  sharePct: number;
  avgAccuracy: number;
  avgDurationMin: number;
};

type SortField = "mode" | "sessions" | "sharePct" | "avgAccuracy" | "avgDurationMin";
type SortDir = "asc" | "desc";

const modeLabelMap: Record<string, string> = {
  inteligentna: "Inteligentna",
  przeglad: "Przegląd",
  katalog: "Katalog",
  osce_topic: "OSCE temat",
};

function modeLabel(mode: string) {
  return modeLabelMap[mode] ?? mode;
}

export function AdminModeBenchmarkTable({ rows }: { rows: ModeRow[] }) {
  const [sortBy, setSortBy] = useState<SortField>("sessions");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const dirMul = sortDir === "asc" ? 1 : -1;
      if (sortBy === "mode") {
        return modeLabel(a.mode).localeCompare(modeLabel(b.mode), "pl") * dirMul;
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
            <SortableTh label="Tryb" field="mode" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Sesje" field="sessions" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Udział" field="sharePct" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Śr. poprawność" field="avgAccuracy" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortableTh label="Śr. czas sesji" field="avgDurationMin" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center font-body text-body-sm text-muted">
                Brak danych dla ostatnich 7 dni.
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={row.mode} className="border-b border-border transition-colors hover:bg-white/[0.02]">
                <td className="px-3 py-3 font-body text-body-sm text-primary">{modeLabel(row.mode)}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">{row.sessions}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">{row.sharePct}%</td>
                <td
                  className={cn(
                    "px-3 py-3 font-body text-body-sm tabular-nums",
                    row.avgAccuracy >= 70 ? "text-success" : row.avgAccuracy < 50 ? "text-error" : "text-secondary",
                  )}
                >
                  {row.avgAccuracy}%
                </td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                  {row.avgDurationMin} min
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
