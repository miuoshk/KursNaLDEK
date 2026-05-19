"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AdminTrendMetric,
  AdminTrendRange,
  AdminTrendSeries,
  AdminTrendTrack,
} from "@/features/admin/server/loadAdminTrendSeries";
import { cn } from "@/lib/utils";

type Year = "all" | 1 | 2 | 3 | 4 | 5 | 6;

const METRIC_TITLES: Record<AdminTrendMetric, string> = {
  sessions: "Sesje",
  time: "Czas nauki",
  answers: "Odpowiedzi",
  users: "Aktywni użytkownicy (DAU)",
  questions: "Unikalne pytania",
  accuracy: "Trafność",
};

const METRIC_HINTS: Record<AdminTrendMetric, string> = {
  sessions: "ukończone study_sessions dziennie",
  time: "łączny czas (minuty) ukończonych sesji",
  answers: "łączna liczba odpowiedzi z ukończonych sesji",
  users: "liczba unikalnych użytkowników z sesją w danym dniu",
  questions: "unikalne (user × pytanie) z odpowiedziami danego dnia",
  accuracy: "trafność (%) z ukończonych sesji w danym dniu",
};

const RANGE_LABELS: Record<AdminTrendRange, string> = {
  "7": "7 dni",
  "30": "30 dni",
  "90": "90 dni",
  "365": "365 dni",
};

function formatTotal(metric: AdminTrendMetric, total: number): string {
  if (metric === "accuracy") return `${total.toFixed(1)}%`;
  if (metric === "time") return `${Math.round(total)} min`;
  return new Intl.NumberFormat("pl-PL").format(Math.round(total));
}

function formatTickDate(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit" }).format(d);
}

function formatTooltipDate(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function AdminTrendChart({
  metric,
  defaultRange = "30",
  defaultTrack = "all",
  defaultYear = "all",
}: {
  metric: AdminTrendMetric;
  defaultRange?: AdminTrendRange;
  defaultTrack?: AdminTrendTrack;
  defaultYear?: Year;
}) {
  const [range, setRange] = useState<AdminTrendRange>(defaultRange);
  const [track, setTrack] = useState<AdminTrendTrack>(defaultTrack);
  const [year, setYear] = useState<Year>(defaultYear);
  const [data, setData] = useState<AdminTrendSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      metric,
      range,
      track,
      year: year === "all" ? "all" : String(year),
    });
    fetch(`/api/admin/trends?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as AdminTrendSeries;
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
  }, [metric, range, track, year]);

  const ariaId = useMemo(() => `chart-${metric}`, [metric]);

  return (
    <section
      className="rounded-card border border-border bg-card p-5"
      aria-labelledby={ariaId}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 id={ariaId} className="font-heading text-lg font-bold text-primary">
            {METRIC_TITLES[metric]}
          </h3>
          <p className="mt-0.5 font-body text-body-xs text-muted">
            {METRIC_HINTS[metric]}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-heading text-2xl font-bold text-brand-gold">
            {data ? formatTotal(metric, data.total) : "—"}
          </p>
          <p className="font-body text-body-xs text-muted">
            łącznie · {RANGE_LABELS[range]}
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

      <div className="mt-4 h-56">
        {loading && !data ? (
          <div className="flex h-full items-center justify-center font-body text-body-xs text-muted">
            Ładowanie…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center font-body text-body-xs text-error">
            {error}
          </div>
        ) : data ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.points} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatTickDate}
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "#1E3F44",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  color: "#fff",
                  fontFamily: "var(--font-body, sans-serif)",
                }}
                labelFormatter={(label) => formatTooltipDate(String(label))}
                formatter={(value) => {
                  const num = typeof value === "number" ? value : Number(value);
                  if (!Number.isFinite(num)) return ["—", METRIC_TITLES[metric]];
                  if (metric === "accuracy") return [`${num.toFixed(1)}%`, "Trafność"];
                  if (metric === "time") return [`${num} min`, "Czas"];
                  return [
                    new Intl.NumberFormat("pl-PL").format(num),
                    METRIC_TITLES[metric],
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#C9A84C"
                strokeWidth={2}
                fill={`url(#gradient-${metric})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
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
              ? "bg-brand-gold/15 text-brand-gold"
              : "text-secondary hover:text-primary",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
