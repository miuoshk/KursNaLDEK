import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminTrendMetric =
  | "sessions"
  | "time"
  | "answers"
  | "users"
  | "questions"
  | "accuracy";

export type AdminTrendRange = "7" | "30" | "90" | "365";

export type AdminTrendTrack = "all" | "lekarski" | "stomatologia";

export type AdminTrendParams = {
  metric: AdminTrendMetric;
  track?: AdminTrendTrack;
  year?: "all" | number;
  range?: AdminTrendRange;
};

export type AdminTrendPoint = {
  /** YYYY-MM-DD (Europe/Warsaw) */
  date: string;
  value: number;
};

export type AdminTrendSeries = {
  metric: AdminTrendMetric;
  unit: string;
  total: number;
  points: AdminTrendPoint[];
};

function metricUnit(metric: AdminTrendMetric): string {
  switch (metric) {
    case "sessions":
      return "sesji";
    case "time":
      return "minut";
    case "answers":
      return "odpowiedzi";
    case "users":
      return "userów (DAU)";
    case "questions":
      return "pytań";
    case "accuracy":
      return "%";
  }
}

/**
 * Seria trendu liczona po stronie bazy (RPC `admin_trend_series`). Agregacja
 * dzienna w SQL (kubełki Europe/Warsaw) zamiast pobierania wszystkich wierszy i
 * liczenia w JS. Wynik buforowany krótko (`unstable_cache`), bo wykresy
 * dociągają się leniwie i często równolegle.
 */
const loadTrendSeriesUncached = async (
  metric: AdminTrendMetric,
  track: AdminTrendTrack,
  year: "all" | number,
  range: AdminTrendRange,
): Promise<AdminTrendSeries> => {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("admin_trend_series", {
    p_metric: metric,
    p_track: track,
    p_year: year === "all" ? null : year,
    p_range: Number(range),
  });

  if (error || !data) {
    if (error) console.error("[loadAdminTrendSeries]", error.message);
    return { metric, unit: metricUnit(metric), total: 0, points: [] };
  }

  const result = data as unknown as AdminTrendSeries;
  return {
    metric,
    unit: result.unit || metricUnit(metric),
    total: Number(result.total ?? 0),
    points: (result.points ?? []).map((p) => ({
      date: p.date,
      value: Number(p.value ?? 0),
    })),
  };
};

const getCachedTrendSeries = unstable_cache(
  loadTrendSeriesUncached,
  ["admin-trend-series"],
  { revalidate: 60 },
);

export async function loadAdminTrendSeries(
  params: AdminTrendParams,
): Promise<AdminTrendSeries> {
  const metric = params.metric;
  const track = params.track ?? "all";
  const year = params.year ?? "all";
  const range = params.range ?? "30";
  return getCachedTrendSeries(metric, track, year, range);
}
