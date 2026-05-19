"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type UserRow = {
  userId: string;
  displayName: string;
  track: string | null;
  trackKey: "lekarski" | "stomatologia" | "inny" | null;
  year: number | null;
  sessions: number;
  questions: number;
  studyHours: number;
  avgAccuracy: number;
  totalPlatformMinutes: number;
  totalTestMinutes: number;
  avgTestDurationMinutes: number;
};

type SortField =
  | "displayName"
  | "sessions"
  | "questions"
  | "totalPlatformMinutes"
  | "totalTestMinutes"
  | "avgTestDurationMinutes"
  | "avgAccuracy";

type SortDir = "asc" | "desc";

const PAGE_SIZE = 15;

type Props = {
  rows: UserRow[];
};

export function AdminUserBenchmarkTable({ rows }: Props) {
  const [sortBy, setSortBy] = useState<SortField>("sessions");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [trackFilter, setTrackFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [showAll, setShowAll] = useState(false);

  const tracks = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.trackKey) set.add(r.trackKey);
    return Array.from(set).sort();
  }, [rows]);

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const r of rows) if (r.year != null) set.add(r.year);
    return Array.from(set).sort((a, b) => a - b);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (trackFilter && r.trackKey !== trackFilter) return false;
      if (yearFilter && String(r.year ?? "") !== yearFilter) return false;
      return true;
    });
  }, [rows, trackFilter, yearFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const dirMul = sortDir === "asc" ? 1 : -1;
      if (sortBy === "displayName") {
        return a.displayName.localeCompare(b.displayName, "pl") * dirMul;
      }
      return ((a[sortBy] ?? 0) - (b[sortBy] ?? 0)) * dirMul;
    });
    return copy;
  }, [filtered, sortBy, sortDir]);

  const visible = showAll ? sorted : sorted.slice(0, PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-body text-body-xs uppercase tracking-widest text-muted">
          Filtruj:
        </span>
        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value)}
          className="rounded-btn border border-border bg-card px-3 py-1 font-body text-body-xs text-primary"
        >
          <option value="">Wszystkie kierunki</option>
          {tracks.map((t) => (
            <option key={t} value={t}>
              {t === "lekarski" ? "Lekarski" : t === "stomatologia" ? "Stomatologia" : "Inny"}
            </option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-btn border border-border bg-card px-3 py-1 font-body text-body-xs text-primary"
        >
          <option value="">Wszystkie lata</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              Rok {y}
            </option>
          ))}
        </select>
        <span className="font-body text-body-xs text-muted">
          {filtered.length} użytkowników
        </span>
      </div>

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-card">
              <SortableTh label="Użytkownik" field="displayName" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Kierunek
              </th>
              <SortableTh label="Sesje (30d)" field="sessions" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
              <SortableTh label="Pytania" field="questions" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
              <SortableTh label="Czas na platformie" field="totalPlatformMinutes" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
              <SortableTh label="Czas na testach" field="totalTestMinutes" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
              <SortableTh label="Śr. czas testu" field="avgTestDurationMinutes" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
              <SortableTh label="Śr. poprawność" field="avgAccuracy" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center font-body text-body-sm text-muted">
                  Brak danych użytkowników dla wybranych filtrów.
                </td>
              </tr>
            ) : (
              visible.map((row, idx) => (
                <tr
                  key={row.userId}
                  className="border-b border-border transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-3 font-body text-body-sm text-primary">
                    <span className="inline-flex items-center gap-2">
                      <span className="font-body text-body-xs text-muted tabular-nums">
                        #{idx + 1}
                      </span>
                      {row.displayName}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-body text-body-sm text-secondary">
                    {row.track ? (
                      <span className="rounded-pill bg-white/5 px-2 py-0.5 font-body text-body-xs">
                        {row.year ? `${row.year} ` : ""}
                        {row.track}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                    {row.sessions}
                  </td>
                  <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                    {row.questions}
                  </td>
                  <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                    {formatMinutes(row.totalPlatformMinutes)}
                  </td>
                  <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                    {formatMinutes(row.totalTestMinutes)}
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

      {sorted.length > PAGE_SIZE && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="font-body text-body-xs text-brand-gold transition-colors hover:text-white"
        >
          {showAll ? "Pokaż top 15" : `Pokaż wszystkich (${sorted.length})`}
        </button>
      )}
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
