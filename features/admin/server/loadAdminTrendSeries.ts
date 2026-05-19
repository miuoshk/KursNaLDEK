import "server-only";
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
  /** YYYY-MM-DD (UTC) */
  date: string;
  value: number;
};

export type AdminTrendSeries = {
  metric: AdminTrendMetric;
  unit: string;
  total: number;
  points: AdminTrendPoint[];
};

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function emptySeries(days: number, startMs: number): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(startMs + i * 86400000);
    map.set(dayKey(d), 0);
  }
  return map;
}

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
 * Pobiera ID userów zgodne z filtrem (kierunek + rok studiów).
 * Zwraca null gdy filtr nie zawęża (wówczas pomijamy join).
 */
async function resolveUserScope(
  track: AdminTrendTrack,
  year: "all" | number,
): Promise<string[] | null> {
  if (track === "all" && year === "all") return null;
  const admin = createAdminClient();
  let q = admin.from("profiles").select("id");
  if (track !== "all") q = q.eq("current_track", track);
  if (year !== "all") q = q.eq("current_year", year);
  const { data } = await q;
  return (data ?? []).map((row) => row.id as string);
}

export async function loadAdminTrendSeries(
  params: AdminTrendParams,
): Promise<AdminTrendSeries> {
  const range = params.range ?? "30";
  const track = params.track ?? "all";
  const year = params.year ?? "all";
  const days = Number(range);
  const now = Date.now();
  // Wyrównujemy do północy UTC dla stabilnych kubełków dziennie.
  const todayMid = new Date();
  todayMid.setUTCHours(0, 0, 0, 0);
  const endMs = todayMid.getTime();
  const startMs = endMs - (days - 1) * 86400000;
  const sinceIso = new Date(startMs).toISOString();

  const userScope = await resolveUserScope(track, year);
  if (userScope && userScope.length === 0) {
    // Filtr nie zwraca żadnego usera — zero w każdym kubełku.
    const buckets = emptySeries(days, startMs);
    return {
      metric: params.metric,
      unit: metricUnit(params.metric),
      total: 0,
      points: Array.from(buckets, ([date, value]) => ({ date, value })),
    };
  }

  const admin = createAdminClient();
  const buckets = emptySeries(days, startMs);

  if (params.metric === "users") {
    // Liczba unikalnych userów per dzień (DAU) — patrzymy na completed sessions.
    let q = admin
      .from("study_sessions")
      .select("user_id, completed_at")
      .eq("is_completed", true)
      .gte("completed_at", sinceIso);
    if (userScope) q = q.in("user_id", userScope);
    const { data } = await q;
    const dailySets = new Map<string, Set<string>>();
    for (const row of data ?? []) {
      const ca = row.completed_at as string | null;
      if (!ca) continue;
      const k = dayKey(new Date(ca));
      if (!buckets.has(k)) continue;
      const set = dailySets.get(k) ?? new Set<string>();
      set.add(row.user_id as string);
      dailySets.set(k, set);
    }
    for (const [k, set] of dailySets) buckets.set(k, set.size);
    let total = 0;
    const totalSet = new Set<string>();
    for (const set of dailySets.values()) for (const id of set) totalSet.add(id);
    total = totalSet.size;
    return {
      metric: params.metric,
      unit: metricUnit(params.metric),
      total,
      points: Array.from(buckets, ([date, value]) => ({ date, value })),
    };
  }

  if (params.metric === "questions") {
    // Unikalne (user, question) — patrzymy na session_answers join sessions.
    let answersQ = admin
      .from("session_answers")
      .select(
        "question_id, answered_at, study_sessions!inner(user_id, is_completed)",
      )
      .gte("answered_at", sinceIso)
      .eq("study_sessions.is_completed", true);
    if (userScope) {
      answersQ = answersQ.in("study_sessions.user_id", userScope);
    }
    const { data } = await answersQ;
    const dailyPairs = new Map<string, Set<string>>();
    const allPairs = new Set<string>();
    for (const row of data ?? []) {
      const at = row.answered_at as string | null;
      if (!at) continue;
      const k = dayKey(new Date(at));
      if (!buckets.has(k)) continue;
      const ss = row.study_sessions as { user_id?: string } | null;
      const userId = ss?.user_id;
      if (!userId) continue;
      const pair = `${userId}|${row.question_id}`;
      const set = dailyPairs.get(k) ?? new Set<string>();
      if (!allPairs.has(pair)) {
        set.add(pair);
        allPairs.add(pair);
      }
      dailyPairs.set(k, set);
    }
    for (const [k, set] of dailyPairs) buckets.set(k, set.size);
    return {
      metric: params.metric,
      unit: metricUnit(params.metric),
      total: allPairs.size,
      points: Array.from(buckets, ([date, value]) => ({ date, value })),
    };
  }

  // sessions / time / answers / accuracy — agregat z study_sessions
  let q = admin
    .from("study_sessions")
    .select("user_id, completed_at, duration_seconds, total_questions, accuracy, correct_answers")
    .eq("is_completed", true)
    .gte("completed_at", sinceIso);
  if (userScope) q = q.in("user_id", userScope);
  const { data } = await q;

  if (params.metric === "accuracy") {
    const dailyCorrect = new Map<string, number>();
    const dailyTotal = new Map<string, number>();
    let totalCorrect = 0;
    let totalTotal = 0;
    for (const row of data ?? []) {
      const ca = row.completed_at as string | null;
      if (!ca) continue;
      const k = dayKey(new Date(ca));
      if (!buckets.has(k)) continue;
      const c = Number(row.correct_answers ?? 0);
      const t = Number(row.total_questions ?? 0);
      dailyCorrect.set(k, (dailyCorrect.get(k) ?? 0) + c);
      dailyTotal.set(k, (dailyTotal.get(k) ?? 0) + t);
      totalCorrect += c;
      totalTotal += t;
    }
    for (const [k] of buckets) {
      const c = dailyCorrect.get(k) ?? 0;
      const t = dailyTotal.get(k) ?? 0;
      buckets.set(k, t > 0 ? Math.round((c / t) * 1000) / 10 : 0);
    }
    return {
      metric: params.metric,
      unit: metricUnit(params.metric),
      total: totalTotal > 0 ? Math.round((totalCorrect / totalTotal) * 1000) / 10 : 0,
      points: Array.from(buckets, ([date, value]) => ({ date, value })),
    };
  }

  let total = 0;
  for (const row of data ?? []) {
    const ca = row.completed_at as string | null;
    if (!ca) continue;
    const k = dayKey(new Date(ca));
    if (!buckets.has(k)) continue;
    let inc = 0;
    if (params.metric === "sessions") inc = 1;
    else if (params.metric === "time")
      inc = Math.round((Number(row.duration_seconds ?? 0) / 60) * 10) / 10;
    else if (params.metric === "answers") inc = Number(row.total_questions ?? 0);
    buckets.set(k, (buckets.get(k) ?? 0) + inc);
    total += inc;
  }

  return {
    metric: params.metric,
    unit: metricUnit(params.metric),
    total: Math.round(total * 10) / 10,
    points: Array.from(buckets, ([date, value]) => ({ date, value })),
  };
}
