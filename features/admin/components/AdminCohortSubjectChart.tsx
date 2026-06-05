"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminCohortSubjectSeries } from "@/features/admin/server/loadAdminCohortSubjectPopularity";
import type { AdminTrendRange, AdminTrendTrack } from "@/features/admin/server/loadAdminTrendSeries";
import { statAxisTick, statTooltipProps } from "@/features/statistics/lib/chartTheme";
import { cn } from "@/lib/utils";

type Year = "all" | 1 | 2 | 3 | 4 | 5 | 6;

const RANGE_LABELS: Record<AdminTrendRange, string> = {
  "7": "7 dni",
  "30": "30 dni",
  "90": "90 dni",
  "365": "365 dni",
};

function cohortLabel(track: AdminTrendTrack, year: Year): string {
  const trackPart =
    track === "lekarski" ? "LEK" : track === "stomatologia" ? "STOMA" : "Wszyscy";
  const yearPart = year === "all" ? "wszystkie lata" : `rok ${year}`;
  return `${trackPart} · ${yearPart}`;
}

export function AdminCohortSubjectChart({
  defaultRange = "30",
  defaultTrack = "all",
  defaultYear = "all",
}: {
  defaultRange?: AdminTrendRange;
  defaultTrack?: AdminTrendTrack;
  defaultYear?: Year;
}) {
  const [range, setRange] = useState<AdminTrendRange>(defaultRange);
  const [track, setTrack] = useState<AdminTrendTrack>(defaultTrack);
  const [year, setYear] = useState<Year>(defaultYear);
  const [data, setData] = useState<AdminCohortSubjectSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      range,
      track,
      year: year === "all" ? "all" : String(year),
    });
    fetch(`/api/admin/cohort-subjects?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as AdminCohortSubjectSeries;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
      })
      .catch((e) => {
        if (cancelled || (e as { name?: string })?.name === "AbortError") return;
        setError("Nie udało się pobrać danych.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [range, track, year]);

  const chartData = useMemo(
    () =>
      (data?.subjects ?? []).map((d) => ({
        ...d,
        label:
          d.subjectName.length > 26 ? `${d.subjectName.slice(0, 26)}…` : d.subjectName,
      })),
    [data?.subjects],
  );

  const chartHeight = Math.max(220, Math.min(chartData.length * 34 + 48, 420));

  return (
    <section className="rounded-card border border-border bg-card p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-bold text-primary">
            Przedmioty kohorty
          </h3>
          <p className="mt-0.5 font-body text-body-xs text-muted">
            Top przedmiotów wg liczby sesji — filtruj kierunek i rok studiów
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-heading text-2xl font-bold text-brand-gold">
            {data ? new Intl.NumberFormat("pl-PL").format(data.totalSessions) : "—"}
          </p>
          <p className="font-body text-body-xs text-muted">
            sesji · {cohortLabel(track, year)}
          </p>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        <Pills
          value={range}
          onChange={setRange}
          items={[
            { id: "7", label: "7 d" },
            { id: "30", label: "30 d" },
            { id: "90", label: "90 d" },
            { id: "365", label: "365 d" },
          ]}
        />
        <Pills
          value={track}
          onChange={setTrack}
          items={[
            { id: "all", label: "Wszyscy" },
            { id: "lekarski", label: "Lekarski" },
            { id: "stomatologia", label: "Stomatologia" },
          ]}
        />
        <Pills
          value={year}
          onChange={setYear}
          items={[
            { id: "all", label: "Wszystkie lata" },
            { id: 1, label: "Rok 1" },
            { id: 2, label: "Rok 2" },
            { id: 3, label: "Rok 3" },
            { id: 4, label: "Rok 4" },
            { id: 5, label: "Rok 5" },
            { id: 6, label: "Rok 6" },
          ]}
        />
      </div>

      <div className="mt-4" style={{ height: chartHeight }}>
        {loading && !data ? (
          <div className="flex h-full items-center justify-center font-body text-body-xs text-muted">
            Ładowanie…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center font-body text-body-xs text-error">
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center font-body text-body-xs text-muted">
            Brak sesji dla wybranej kohorty w tym zakresie.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 0, left: 4 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                tick={statAxisTick}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ ...statAxisTick, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={150}
              />
              <Tooltip
                {...statTooltipProps}
                formatter={(value, name, item) => {
                  const v = typeof value === "number" ? value : Number(value) || 0;
                  if (name === "sessions") {
                    const breakdown = item.payload.trackBreakdown as
                      | { track: string; sessions: number }[]
                      | undefined;
                    if (breakdown && breakdown.length > 1) {
                      const detail = breakdown
                        .map((b) => `${b.track}: ${b.sessions}`)
                        .join(", ");
                      return [`${v} (${detail})`, "Sesje"];
                    }
                    return [v, "Sesje"];
                  }
                  if (name === "avgAccuracy") return [`${v}%`, "Śr. poprawność"];
                  return [v, String(name)];
                }}
              />
              <Bar
                dataKey="sessions"
                fill="var(--color-brand-sage)"
                radius={[0, 6, 6, 0]}
                barSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

type PillOption<T> = { id: T; label: string };

function Pills<T extends string | number>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: PillOption<T>[];
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-pill border border-[rgba(255,255,255,0.08)] bg-card-hover/40 p-1">
      {items.map((it) => (
        <button
          key={String(it.id)}
          type="button"
          onClick={() => onChange(it.id)}
          className={cn(
            "rounded-pill px-2.5 py-1 font-body text-[11px] transition-colors",
            value === it.id
              ? "bg-brand-sage/20 text-brand-sage"
              : "text-secondary hover:text-primary",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
