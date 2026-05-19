import "server-only";

import { createClient } from "@/lib/supabase/server";

export type GrowthPoint = {
  date: string;
  dau: number;
  wau: number;
  mau: number;
};

export type RetentionCohort = {
  cohortWeek: string;
  cohortSize: number;
  d1: number;
  d7: number;
  d30: number;
};

export type AdminInvestorData = {
  growth: {
    dau: number;
    wau: number;
    mau: number;
    dauWauRatio: number; // % - sticky factor
    timeSeries: GrowthPoint[];
  };
  engagement: {
    avgSessionsPerActiveUser30d: number;
    avgQuestionsPerSession: number;
    avgTestDurationMinutes: number;
    weeklyActiveRatePct: number;
    medianStreakDays: number;
  };
  monetization: {
    paidConversionPct: number;
    paidActiveTotal: number;
    medianDaysToFirstPaidPayment: number | null;
    paidActiveByTrackYear: Array<{
      trackKey: "lekarski" | "stomatologia";
      year: number;
      paidActive: number;
      totalUsers: number;
      paidPct: number;
    }>;
  };
  quality: {
    avgAccuracy30d: number;
    pctUsersReady70: number;
    avgReadiness: number;
  };
  operations: {
    pendingReports: number;
    avgHoursToResolveReport: number | null;
    topSubjects: Array<{ subjectName: string; sessions: number; track: string | null; year: number | null }>;
  };
  totalUsers: number;
  generatedAtIso: string;
};

const MS = {
  day: 86400000,
  week: 7 * 86400000,
  month: 30 * 86400000,
};

type SessionRow = {
  user_id: string | null;
  total_questions: number | null;
  correct_answers: number | null;
  duration_seconds: number | null;
  started_at: string | null;
  mode: string | null;
  accuracy: number | null;
  subject_id: string | null;
};

const TEST_MODES = new Set(["inteligentna", "przeglad", "osce_topic"]);

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function safeAccuracy(row: SessionRow): number {
  if (typeof row.accuracy === "number") return row.accuracy;
  const total = row.total_questions ?? 0;
  const correct = row.correct_answers ?? 0;
  return total > 0 ? correct / total : 0;
}

export async function loadAdminInvestor(): Promise<AdminInvestorData> {
  const supabase = await createClient();
  const now = Date.now();
  const since90Iso = new Date(now - 90 * MS.day).toISOString();

  const [sessionsRes, profilesRes, subjectsRes, entitlementsRes, reportsRes] = await Promise.all([
    supabase
      .from("study_sessions")
      .select(
        "user_id, total_questions, correct_answers, duration_seconds, started_at, mode, accuracy, subject_id",
      )
      .gte("started_at", since90Iso),
    supabase
      .from("profiles")
      .select("id, current_track, current_year, current_streak, created_at, subscription_status"),
    supabase.from("subjects").select("id, name, track, year"),
    supabase
      .from("user_year_entitlements")
      .select("user_id, track, year, access_type, active, granted_at"),
    supabase
      .from("error_reports")
      .select("id, status, created_at, resolved_at"),
  ]);

  const sessions = (sessionsRes.data ?? []) as SessionRow[];
  const profiles = profilesRes.data ?? [];
  const subjects = subjectsRes.data ?? [];
  const entitlements = entitlementsRes.data ?? [];
  const reports = reportsRes.data ?? [];

  const subjectMap = new Map<string, { name: string; track: string | null; year: number | null }>();
  for (const s of subjects) {
    subjectMap.set(s.id as string, {
      name: (s.name as string) ?? (s.id as string),
      track: (s.track as string | null) ?? null,
      year: (s.year as number | null) ?? null,
    });
  }

  // Time series 30 days backwards
  const dayBuckets = new Map<string, Set<string>>();
  for (const row of sessions) {
    if (!row.started_at || !row.user_id) continue;
    const key = dateKey(new Date(row.started_at));
    const set = dayBuckets.get(key) ?? new Set<string>();
    set.add(row.user_id);
    dayBuckets.set(key, set);
  }

  const timeSeries: GrowthPoint[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(now - i * MS.day);
    const key = dateKey(d);
    const dau = dayBuckets.get(key)?.size ?? 0;

    const wauSet = new Set<string>();
    for (let j = 0; j < 7; j += 1) {
      const day = new Date(now - (i + j) * MS.day);
      for (const uid of dayBuckets.get(dateKey(day)) ?? []) wauSet.add(uid);
    }
    const mauSet = new Set<string>();
    for (let j = 0; j < 30; j += 1) {
      const day = new Date(now - (i + j) * MS.day);
      for (const uid of dayBuckets.get(dateKey(day)) ?? []) mauSet.add(uid);
    }

    timeSeries.push({
      date: key,
      dau,
      wau: wauSet.size,
      mau: mauSet.size,
    });
  }

  const todayKey = dateKey(new Date(now));
  const dau = dayBuckets.get(todayKey)?.size ?? timeSeries[timeSeries.length - 1]?.dau ?? 0;
  const wau = timeSeries[timeSeries.length - 1]?.wau ?? 0;
  const mau = timeSeries[timeSeries.length - 1]?.mau ?? 0;
  const dauWauRatio = wau > 0 ? Number(((dau / wau) * 100).toFixed(1)) : 0;

  // Engagement (30d)
  const sessions30d = sessions.filter(
    (s) => s.started_at && new Date(s.started_at).getTime() >= now - 30 * MS.day,
  );
  const sessions7d = sessions.filter(
    (s) => s.started_at && new Date(s.started_at).getTime() >= now - 7 * MS.day,
  );

  const userSessionMap = new Map<string, number>();
  for (const row of sessions30d) {
    if (!row.user_id) continue;
    userSessionMap.set(row.user_id, (userSessionMap.get(row.user_id) ?? 0) + 1);
  }
  const activeUsers30d = userSessionMap.size;
  const avgSessionsPerActiveUser30d =
    activeUsers30d > 0
      ? Number((sessions30d.length / activeUsers30d).toFixed(1))
      : 0;
  const totalQ = sessions30d.reduce((s, r) => s + (r.total_questions ?? 0), 0);
  const avgQuestionsPerSession =
    sessions30d.length > 0 ? Number((totalQ / sessions30d.length).toFixed(1)) : 0;

  const testSessions30d = sessions30d.filter((s) =>
    TEST_MODES.has(((s.mode as string | null) ?? "").toLowerCase()),
  );
  const testDurationSum = testSessions30d.reduce(
    (s, r) => s + (r.duration_seconds ?? 0),
    0,
  );
  const avgTestDurationMinutes =
    testSessions30d.length > 0
      ? Number(((testDurationSum / 60) / testSessions30d.length).toFixed(1))
      : 0;

  const weeklyActiveUsers = new Set<string>();
  for (const row of sessions7d) {
    if (row.user_id) weeklyActiveUsers.add(row.user_id);
  }
  const weeklyActiveRatePct =
    profiles.length > 0
      ? Number(((weeklyActiveUsers.size / profiles.length) * 100).toFixed(1))
      : 0;

  const streaks = profiles
    .map((p) => (p.current_streak as number | null) ?? 0)
    .sort((a, b) => a - b);
  const medianStreakDays =
    streaks.length > 0
      ? streaks[Math.floor(streaks.length / 2)] ?? 0
      : 0;

  // Monetization
  const paidUsersByUid = new Set<string>();
  const paidGrantTimes = new Map<string, number>();
  for (const e of entitlements) {
    if (e.access_type !== "paid" || e.active !== true) continue;
    const uid = e.user_id as string;
    paidUsersByUid.add(uid);
    const grantedAt = e.granted_at as string | null;
    if (grantedAt) {
      const t = new Date(grantedAt).getTime();
      const existing = paidGrantTimes.get(uid);
      if (existing == null || t < existing) paidGrantTimes.set(uid, t);
    }
  }

  const profileCreatedAt = new Map<string, number>();
  for (const p of profiles) {
    const created = p.created_at as string | null;
    if (created) profileCreatedAt.set(p.id as string, new Date(created).getTime());
  }

  const daysToFirstPaid: number[] = [];
  for (const [uid, grantedTs] of paidGrantTimes) {
    const created = profileCreatedAt.get(uid);
    if (!created) continue;
    const diff = (grantedTs - created) / MS.day;
    if (diff >= 0 && diff < 365 * 2) daysToFirstPaid.push(diff);
  }
  daysToFirstPaid.sort((a, b) => a - b);
  const medianDaysToFirstPaidPayment =
    daysToFirstPaid.length > 0
      ? Number(
          daysToFirstPaid[Math.floor(daysToFirstPaid.length / 2)]?.toFixed(1) ?? 0,
        )
      : null;

  const cohortMap = new Map<
    string,
    { trackKey: "lekarski" | "stomatologia"; year: number; total: number; paid: Set<string> }
  >();
  for (const p of profiles) {
    const track = p.current_track === "lekarski" ? "lekarski" : "stomatologia";
    const year = (p.current_year as number | null) ?? null;
    if (!year) continue;
    const key = `${track}|${year}`;
    const bucket = cohortMap.get(key) ?? {
      trackKey: track,
      year,
      total: 0,
      paid: new Set<string>(),
    };
    bucket.total += 1;
    cohortMap.set(key, bucket);
  }
  for (const e of entitlements) {
    if (e.access_type !== "paid" || e.active !== true) continue;
    const track = e.track === "lekarski" ? "lekarski" : "stomatologia";
    const year = Number(e.year);
    if (!year) continue;
    const key = `${track}|${year}`;
    const bucket = cohortMap.get(key) ?? {
      trackKey: track,
      year,
      total: 0,
      paid: new Set<string>(),
    };
    bucket.paid.add(e.user_id as string);
    cohortMap.set(key, bucket);
  }
  const paidActiveByTrackYear = Array.from(cohortMap.values())
    .map((b) => ({
      trackKey: b.trackKey,
      year: b.year,
      paidActive: b.paid.size,
      totalUsers: b.total,
      paidPct:
        b.total > 0 ? Number(((b.paid.size / b.total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => {
      if (a.trackKey !== b.trackKey) return a.trackKey.localeCompare(b.trackKey);
      return a.year - b.year;
    });

  const paidConversionPct =
    profiles.length > 0
      ? Number(((paidUsersByUid.size / profiles.length) * 100).toFixed(1))
      : 0;

  // Quality
  const totalAccuracy30d = sessions30d.reduce((s, r) => s + safeAccuracy(r), 0);
  const avgAccuracy30d =
    sessions30d.length > 0
      ? Number(((totalAccuracy30d / sessions30d.length) * 100).toFixed(1))
      : 0;

  // Per-user 30d average accuracy
  const userAccMap = new Map<string, { sum: number; count: number }>();
  for (const row of sessions30d) {
    if (!row.user_id) continue;
    const stats = userAccMap.get(row.user_id) ?? { sum: 0, count: 0 };
    stats.sum += safeAccuracy(row);
    stats.count += 1;
    userAccMap.set(row.user_id, stats);
  }
  let ready70 = 0;
  let readinessSum = 0;
  let readinessCount = 0;
  for (const [, stats] of userAccMap) {
    if (stats.count === 0) continue;
    const avg = stats.sum / stats.count;
    readinessSum += avg;
    readinessCount += 1;
    if (avg >= 0.7) ready70 += 1;
  }
  const pctUsersReady70 =
    readinessCount > 0
      ? Number(((ready70 / readinessCount) * 100).toFixed(1))
      : 0;
  const avgReadiness =
    readinessCount > 0
      ? Number(((readinessSum / readinessCount) * 100).toFixed(1))
      : 0;

  // Operations
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const resolved = reports.filter(
    (r) => r.resolved_at !== null && r.created_at !== null,
  );
  let avgHoursToResolveReport: number | null = null;
  if (resolved.length > 0) {
    const totalH = resolved.reduce((acc, r) => {
      const created = new Date(r.created_at as string).getTime();
      const resolvedTs = new Date(r.resolved_at as string).getTime();
      return acc + (resolvedTs - created) / (60 * 60 * 1000);
    }, 0);
    avgHoursToResolveReport = Number((totalH / resolved.length).toFixed(1));
  }

  const subjectSessionCount = new Map<string, number>();
  for (const row of sessions30d) {
    if (!row.subject_id) continue;
    subjectSessionCount.set(
      row.subject_id,
      (subjectSessionCount.get(row.subject_id) ?? 0) + 1,
    );
  }
  const topSubjects = Array.from(subjectSessionCount.entries())
    .map(([subjectId, count]) => {
      const meta = subjectMap.get(subjectId);
      return {
        subjectName: meta?.name ?? subjectId,
        sessions: count,
        track: meta?.track ?? null,
        year: meta?.year ?? null,
      };
    })
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 5);

  return {
    growth: {
      dau,
      wau,
      mau,
      dauWauRatio,
      timeSeries,
    },
    engagement: {
      avgSessionsPerActiveUser30d,
      avgQuestionsPerSession,
      avgTestDurationMinutes,
      weeklyActiveRatePct,
      medianStreakDays,
    },
    monetization: {
      paidConversionPct,
      paidActiveTotal: paidUsersByUid.size,
      medianDaysToFirstPaidPayment,
      paidActiveByTrackYear,
    },
    quality: {
      avgAccuracy30d,
      pctUsersReady70,
      avgReadiness,
    },
    operations: {
      pendingReports,
      avgHoursToResolveReport,
      topSubjects,
    },
    totalUsers: profiles.length,
    generatedAtIso: new Date().toISOString(),
  };
}
