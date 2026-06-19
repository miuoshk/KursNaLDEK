import "server-only";

import { warsawYmd } from "@/lib/datetime/warsawCalendar";
import {
  getAllErrorReports,
  getAllProfiles,
  getAllSubjects,
  getDashboardSessionAggregates,
  getTotalQuestionsCount,
  type AggUserStat,
} from "@/features/admin/server/loadAdminShared";
import { mergeSubjectPopularityByShortName } from "@/features/admin/server/mergeSubjectPopularity";

export type TrackKey = "lekarski" | "stomatologia" | "inny";

export type AdminUserSegment = {
  track: TrackKey;
  year: number | null;
  label: string;
  count: number;
  /** Zarejestrowani / roczna liczebność rocznika na kierunku (LEK 288, STOMA 120). */
  pctOfYearCapacity: number | null;
  activeLast7d: number;
  activeLast30d: number;
  /** Ukończone sesje (testy) w 30 dniach / liczba userów w segmencie. */
  avgCompletedTestsPerUser: number;
};

/** Szacowana liczebność rocznika na kierunku (do %Total). */
const YEAR_COHORT_CAPACITY: Record<Exclude<TrackKey, "inny">, number> = {
  lekarski: 288,
  stomatologia: 120,
};

export type AdminHourBucket = {
  hour: number;
  sessions: number;
  questions: number;
  avgAccuracy: number;
};

export type AdminDayOfWeekBucket = {
  dow: number;
  label: string;
  sessions: number;
  questions: number;
  avgAccuracy: number;
};

export type AdminHeatmapCell = {
  dow: number;
  hour: number;
  sessions: number;
  intensity: number;
};

export type AdminSubjectPopularity = {
  groupKey: string;
  subjectName: string;
  sessions: number;
  questions: number;
  avgAccuracy: number;
  trackBreakdown: { track: string; sessions: number }[];
};

export type AdminTrackPerformance = {
  track: TrackKey;
  year: number | null;
  label: string;
  sessions: number;
  questions: number;
  avgAccuracy: number;
  avgSessionMin: number;
};

export type AdminEngagement = {
  veryActive: number;
  active: number;
  inactive: number;
  neverStarted: number;
  totalUsers: number;
};

export type AdminSubscriptionSlice = {
  status: string;
  label: string;
  count: number;
};

export type AdminDailyTrendPoint = {
  date: string;
  sessions: number;
  users: number;
  questions: number;
  studyHours: number;
  avgAccuracy: number;
};

export type AdminRegistrationsPoint = {
  date: string;
  registrations: number;
};

export type AdminModeBenchmark = {
  mode: string;
  sessions: number;
  sharePct: number;
  avgAccuracy: number;
  avgDurationMin: number;
};

export type AdminUserBenchmark = {
  userId: string;
  displayName: string;
  track: string | null;
  trackKey: TrackKey | null;
  year: number | null;
  sessions: number;
  questions: number;
  studyHours: number;
  avgAccuracy: number;
  totalPlatformMinutes: number;
  totalTestMinutes: number;
  avgTestDurationMinutes: number;
};

export type AdminCohortBenchmark = {
  trackKey: TrackKey;
  trackLabel: string;
  year: number | null;
  label: string;
  headcount: number;
  activeCount: number;
  paidCount: number;
  paidPct: number;
  avgPlatformMinutes: number;
  avgTestMinutes: number;
  avgTestDurationMinutes: number;
  avgAccuracy: number;
};

export type AdminDashboardData = {
  totalQuestions: number;
  totalUsers: number;
  paidUsers: number;
  pendingReports: number;

  sessionsToday: number;
  sessionsLast7d: number;
  sessionsLast30d: number;
  answeredQuestionsLast7d: number;
  answeredQuestionsLast30d: number;
  answeredQuestionsPrev7d: number;
  completedTestsLast7d: number;

  averageAccuracyLast7d: number;
  averageAccuracyLast30d: number;
  studyHoursLast7d: number;
  studyHoursLast30d: number;
  studyHoursPrev7d: number;
  averageSessionMinutesLast7d: number;

  uniqueActiveUsersLast7d: number;
  uniqueActiveUsersLast30d: number;
  uniqueActiveUsersPrev7d: number;

  sessionsPrev7d: number;

  newRegistrationsLast7d: number;
  newRegistrationsLast30d: number;

  peakHour: { hour: number; sessions: number } | null;
  peakDayOfWeek: { dow: number; label: string; sessions: number } | null;

  topUser: { displayName: string; sessionCount: number } | null;

  userSegments: AdminUserSegment[];
  hourOfDayLast30d: AdminHourBucket[];
  dayOfWeekLast30d: AdminDayOfWeekBucket[];
  heatmapLast30d: AdminHeatmapCell[];
  heatmapMaxSessions: number;
  subjectPopularityLast30d: AdminSubjectPopularity[];
  trackPerformanceLast30d: AdminTrackPerformance[];
  engagementLast30d: AdminEngagement;
  subscriptionBreakdown: AdminSubscriptionSlice[];
  registrationsLast30d: AdminRegistrationsPoint[];
  modeBreakdownLast7d: AdminModeBenchmark[];
  dailyTrendLast14d: AdminDailyTrendPoint[];
  userBenchmarksLast30d: AdminUserBenchmark[];
  cohortBenchmarksLast30d: AdminCohortBenchmark[];
};

const DOW_LABELS = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const TRACK_LABEL: Record<TrackKey, string> = {
  lekarski: "Lekarski",
  stomatologia: "Stomatologia",
  inny: "Inny",
};

function normalizeTrack(value: unknown): TrackKey {
  if (value === "lekarski" || value === "stomatologia") return value;
  return "inny";
}

function trackYearLabel(track: TrackKey, year: number | null): string {
  const trackShort =
    track === "lekarski" ? "LEK" : track === "stomatologia" ? "STOMA" : "—";
  return year ? `${year} ${trackShort}` : trackShort;
}

type ProfileMeta = {
  displayName: string;
  track: TrackKey;
  year: number | null;
  xp: number;
  streak: number;
  subscription: string | null;
  createdAt: string | null;
};

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const now = new Date();
  const since7dMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const since30dMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const [totalQuestions, agg, allProfiles, allSubjects, allReports] =
    await Promise.all([
      getTotalQuestionsCount(),
      getDashboardSessionAggregates(),
      getAllProfiles(),
      getAllSubjects(),
      getAllErrorReports(),
    ]);

  const answeredQuestionsLast7d = agg.answers7d;
  const answeredQuestionsLast30d = agg.answers30d;
  const answeredQuestionsPrev7d = Math.max(0, agg.answers14d - agg.answers7d);

  const subjectMap = new Map<
    string,
    { name: string; shortName: string; track: string | null; year: number | null }
  >();
  for (const s of allSubjects) {
    const name = (s.name as string) ?? (s.id as string);
    subjectMap.set(s.id as string, {
      name,
      shortName: ((s.short_name as string | null) ?? name).trim(),
      track: (s.track as string | null) ?? null,
      year: (s.year as number | null) ?? null,
    });
  }

  const profileMap = new Map<string, ProfileMeta>();
  for (const p of allProfiles) {
    profileMap.set(p.id as string, {
      displayName: ((p.display_name as string | null) ?? "Użytkownik") || "Użytkownik",
      track: normalizeTrack(p.current_track),
      year: (p.current_year as number | null) ?? null,
      xp: (p.xp as number | null) ?? 0,
      streak: (p.current_streak as number | null) ?? 0,
      subscription: (p.subscription_status as string | null) ?? null,
      createdAt: (p.created_at as string | null) ?? null,
    });
  }

  const userStatMap = new Map<string, AggUserStat>();
  for (const u of agg.perUser) userStatMap.set(u.userId, u);

  const sessionsLast7d = agg.sessions7d;
  const sessionsLast30d = agg.sessions30d;
  const sessionsPrev7d = agg.sessionsPrev7d;

  const studyHoursLast7d = Number((agg.durationSec7d / 3600).toFixed(1));
  const studyHoursLast30d = Number((agg.durationSec30d / 3600).toFixed(1));
  const studyHoursPrev7d = Number((agg.durationSecPrev7d / 3600).toFixed(1));
  const averageSessionMinutesLast7d =
    sessionsLast7d > 0
      ? Number(((agg.durationSec7d / 60) / sessionsLast7d).toFixed(1))
      : 0;

  const averageAccuracyLast7d =
    sessionsLast7d > 0
      ? Number(((agg.accSum7d / sessionsLast7d) * 100).toFixed(1))
      : 0;
  const averageAccuracyLast30d =
    sessionsLast30d > 0
      ? Number(((agg.accSum30d / sessionsLast30d) * 100).toFixed(1))
      : 0;

  const activeUsersSet30d = new Set<string>();
  let uniqueActiveUsersLast7d = 0;
  let uniqueActiveUsersLast30d = 0;
  let uniqueActiveUsersPrev7d = 0;
  for (const u of agg.perUser) {
    if (u.sessions30 > 0) {
      activeUsersSet30d.add(u.userId);
      uniqueActiveUsersLast30d += 1;
    }
    if (u.sessions7 > 0) uniqueActiveUsersLast7d += 1;
    if (u.sessionsPrev7 > 0) uniqueActiveUsersPrev7d += 1;
  }

  let topUser: AdminDashboardData["topUser"] = null;
  let topCount = 0;
  for (const u of agg.perUser) {
    if (u.sessions30 > topCount) {
      topCount = u.sessions30;
      topUser = {
        displayName: profileMap.get(u.userId)?.displayName ?? "Użytkownik",
        sessionCount: u.sessions30,
      };
    }
  }

  const newRegistrationsLast7d = allProfiles.filter((p) => {
    const created = p.created_at as string | null;
    return created !== null && new Date(created).getTime() >= since7dMs;
  }).length;
  const newRegistrationsLast30d = allProfiles.filter((p) => {
    const created = p.created_at as string | null;
    return created !== null && new Date(created).getTime() >= since30dMs;
  }).length;

  const paidUsers = allProfiles.filter(
    (p) => p.subscription_status === "active",
  ).length;
  const pendingReports = allReports.filter((r) => r.status === "pending").length;

  // --- Segmenty użytkowników (kierunek × rok) ---
  const segmentBuckets = new Map<
    string,
    AdminUserSegment & {
      activeIds7: Set<string>;
      activeIds30: Set<string>;
      completedTestsSum: number;
    }
  >();
  for (const [uid, profile] of profileMap) {
    const key = `${profile.track}|${profile.year ?? "-"}`;
    const bucket = segmentBuckets.get(key) ?? {
      track: profile.track,
      year: profile.year,
      label: trackYearLabel(profile.track, profile.year),
      count: 0,
      pctOfYearCapacity: null,
      activeLast7d: 0,
      activeLast30d: 0,
      avgCompletedTestsPerUser: 0,
      activeIds7: new Set<string>(),
      activeIds30: new Set<string>(),
      completedTestsSum: 0,
    };
    const stats = userStatMap.get(uid);
    bucket.count += 1;
    bucket.completedTestsSum += stats?.completedTests30 ?? 0;
    if (stats && stats.sessions7 > 0) bucket.activeIds7.add(uid);
    if (stats && stats.sessions30 > 0) bucket.activeIds30.add(uid);
    segmentBuckets.set(key, bucket);
  }
  const userSegments: AdminUserSegment[] = Array.from(segmentBuckets.values())
    .map((b) => {
      const capacity =
        b.track === "lekarski" || b.track === "stomatologia"
          ? YEAR_COHORT_CAPACITY[b.track]
          : null;
      const pctOfYearCapacity =
        capacity && b.year != null
          ? Number(((b.count / capacity) * 100).toFixed(1))
          : null;
      return {
        track: b.track,
        year: b.year,
        label: b.label,
        count: b.count,
        pctOfYearCapacity,
        activeLast7d: b.activeIds7.size,
        activeLast30d: b.activeIds30.size,
        avgCompletedTestsPerUser:
          b.count > 0
            ? Number((b.completedTestsSum / b.count).toFixed(1))
            : 0,
      };
    })
    .sort((a, b) => {
      if (a.track !== b.track) return TRACK_LABEL[a.track].localeCompare(TRACK_LABEL[b.track]);
      return (a.year ?? 99) - (b.year ?? 99);
    });

  // --- Pora dnia / dzień tygodnia / heatmapa (Europe/Warsaw, z RPC) ---
  const hourStats = new Map<number, { sessions: number; questions: number; accSum: number }>();
  for (const h of agg.hour) {
    hourStats.set(h.hour, { sessions: h.sessions, questions: h.questions, accSum: h.accSum });
  }
  const hourOfDayLast30d: AdminHourBucket[] = Array.from({ length: 24 }, (_, hour) => {
    const stats = hourStats.get(hour);
    return {
      hour,
      sessions: stats?.sessions ?? 0,
      questions: stats?.questions ?? 0,
      avgAccuracy:
        stats && stats.sessions > 0
          ? Number(((stats.accSum / stats.sessions) * 100).toFixed(1))
          : 0,
    };
  });

  const dowStats = new Map<number, { sessions: number; questions: number; accSum: number }>();
  for (const d of agg.dow) {
    dowStats.set(d.dow, { sessions: d.sessions, questions: d.questions, accSum: d.accSum });
  }
  const dayOfWeekLast30d: AdminDayOfWeekBucket[] = Array.from({ length: 7 }, (_, idx) => {
    const dow = (idx + 1) % 7; // Pn=1..Nd=0 -> ułożone Pn..Nd
    const stats = dowStats.get(dow);
    return {
      dow,
      label: DOW_LABELS[dow]!,
      sessions: stats?.sessions ?? 0,
      questions: stats?.questions ?? 0,
      avgAccuracy:
        stats && stats.sessions > 0
          ? Number(((stats.accSum / stats.sessions) * 100).toFixed(1))
          : 0,
    };
  });

  const heatmapMap = new Map<string, number>();
  let heatmapMaxSessions = 0;
  for (const cell of agg.heatmap) {
    heatmapMap.set(`${cell.dow}-${cell.hour}`, cell.sessions);
    if (cell.sessions > heatmapMaxSessions) heatmapMaxSessions = cell.sessions;
  }
  const heatmapLast30d: AdminHeatmapCell[] = [];
  for (let dowIdx = 0; dowIdx < 7; dowIdx += 1) {
    const dow = (dowIdx + 1) % 7;
    for (let hour = 0; hour < 24; hour += 1) {
      const sessions = heatmapMap.get(`${dow}-${hour}`) ?? 0;
      const intensity = heatmapMaxSessions > 0 ? sessions / heatmapMaxSessions : 0;
      heatmapLast30d.push({ dow, hour, sessions, intensity });
    }
  }

  let peakHour: AdminDashboardData["peakHour"] = null;
  for (const bucket of hourOfDayLast30d) {
    if (!peakHour || bucket.sessions > peakHour.sessions) {
      peakHour = { hour: bucket.hour, sessions: bucket.sessions };
    }
  }
  if (peakHour && peakHour.sessions === 0) peakHour = null;

  let peakDayOfWeek: AdminDashboardData["peakDayOfWeek"] = null;
  for (const bucket of dayOfWeekLast30d) {
    if (!peakDayOfWeek || bucket.sessions > peakDayOfWeek.sessions) {
      peakDayOfWeek = { dow: bucket.dow, label: bucket.label, sessions: bucket.sessions };
    }
  }
  if (peakDayOfWeek && peakDayOfWeek.sessions === 0) peakDayOfWeek = null;

  // --- Popularność przedmiotów ---
  const subjectPopularityLast30d: AdminSubjectPopularity[] =
    mergeSubjectPopularityByShortName(
      agg.subject.map((row) => {
        const meta = subjectMap.get(row.subjectId);
        return {
          subjectId: row.subjectId,
          subjectName: meta?.name ?? row.subjectId,
          shortName: meta?.shortName ?? row.subjectId,
          track: meta?.track ?? null,
          year: meta?.year ?? null,
          sessions: row.sessions,
          questions: row.questions,
          accSum: row.accSum,
        };
      }),
      10,
    );

  // --- Wydajność kierunków (agregacja per-user wg profilu track/rok) ---
  const trackPerfMap = new Map<
    string,
    {
      track: TrackKey;
      year: number | null;
      sessions: number;
      questions: number;
      accSum: number;
      durationSec: number;
    }
  >();
  for (const u of agg.perUser) {
    const profile = profileMap.get(u.userId);
    if (!profile) continue;
    const key = `${profile.track}|${profile.year ?? "-"}`;
    const stats = trackPerfMap.get(key) ?? {
      track: profile.track,
      year: profile.year,
      sessions: 0,
      questions: 0,
      accSum: 0,
      durationSec: 0,
    };
    stats.sessions += u.sessions30;
    stats.questions += u.questions30;
    stats.accSum += u.accSum30;
    stats.durationSec += u.durationSec30;
    trackPerfMap.set(key, stats);
  }
  const trackPerformanceLast30d: AdminTrackPerformance[] = Array.from(
    trackPerfMap.values(),
  )
    .map((stats) => ({
      track: stats.track,
      year: stats.year,
      label: trackYearLabel(stats.track, stats.year),
      sessions: stats.sessions,
      questions: stats.questions,
      avgAccuracy:
        stats.sessions > 0
          ? Number(((stats.accSum / stats.sessions) * 100).toFixed(1))
          : 0,
      avgSessionMin:
        stats.sessions > 0
          ? Number(((stats.durationSec / 60) / stats.sessions).toFixed(1))
          : 0,
    }))
    .sort((a, b) => {
      if (a.track !== b.track) return TRACK_LABEL[a.track].localeCompare(TRACK_LABEL[b.track]);
      return (a.year ?? 99) - (b.year ?? 99);
    });

  // --- Rozkład subskrypcji (profile) ---
  const subscriptionCounter = new Map<string, number>();
  for (const profile of profileMap.values()) {
    const status = profile.subscription ?? "brak";
    subscriptionCounter.set(status, (subscriptionCounter.get(status) ?? 0) + 1);
  }
  const subscriptionBreakdown: AdminSubscriptionSlice[] = Array.from(
    subscriptionCounter.entries(),
  )
    .map(([status, count]) => ({
      status,
      label:
        status === "active"
          ? "Aktywne"
          : status === "inactive"
            ? "Nieaktywne"
            : status === "brak"
              ? "Brak danych"
              : status,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // --- Zaangażowanie (profile × liczba sesji 30d) ---
  const veryActiveThreshold = 5;
  let veryActive = 0;
  let active = 0;
  let inactive = 0;
  let neverStarted = 0;
  for (const uid of profileMap.keys()) {
    const c = userStatMap.get(uid)?.sessions30 ?? 0;
    if (c >= veryActiveThreshold) veryActive += 1;
    else if (c >= 1) active += 1;
    else if (activeUsersSet30d.has(uid)) inactive += 1;
    else neverStarted += 1;
  }
  const engagementLast30d: AdminEngagement = {
    veryActive,
    active,
    inactive,
    neverStarted,
    totalUsers: profileMap.size,
  };

  // --- Rejestracje (profile, kubełki dzienne Europe/Warsaw) ---
  const registrationsMap = new Map<string, number>();
  for (const profile of profileMap.values()) {
    const created = profile.createdAt;
    if (!created) continue;
    if (new Date(created).getTime() < since30dMs) continue;
    const day = warsawYmd(new Date(created));
    registrationsMap.set(day, (registrationsMap.get(day) ?? 0) + 1);
  }
  const registrationsLast30d: AdminRegistrationsPoint[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const day = warsawYmd(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
    registrationsLast30d.push({ date: day, registrations: registrationsMap.get(day) ?? 0 });
  }

  // --- Tryby nauki (7 dni, z RPC) ---
  const modeBreakdownLast7d: AdminModeBenchmark[] = agg.mode7d
    .map((m) => ({
      mode: m.mode,
      sessions: m.sessions,
      sharePct:
        sessionsLast7d > 0
          ? Number(((m.sessions / sessionsLast7d) * 100).toFixed(1))
          : 0,
      avgAccuracy:
        m.sessions > 0 ? Number(((m.accSum / m.sessions) * 100).toFixed(1)) : 0,
      avgDurationMin:
        m.sessions > 0 ? Number(((m.durationSec / 60) / m.sessions).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);

  // --- Trend dzienny 14 dni (kubełki Europe/Warsaw, z RPC) ---
  const trendByDay = new Map<string, AdminDailyTrendPoint>();
  for (const d of agg.dailyTrend14d) {
    trendByDay.set(d.day, {
      date: d.day,
      sessions: d.sessions,
      users: d.users,
      questions: d.questions,
      studyHours: Number((d.durationSec / 3600).toFixed(1)),
      avgAccuracy:
        d.sessions > 0 ? Number(((d.accSum / d.sessions) * 100).toFixed(1)) : 0,
    });
  }
  const dailyTrendLast14d: AdminDailyTrendPoint[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const day = warsawYmd(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
    dailyTrendLast14d.push(
      trendByDay.get(day) ?? {
        date: day,
        sessions: 0,
        users: 0,
        questions: 0,
        studyHours: 0,
        avgAccuracy: 0,
      },
    );
  }

  // --- Benchmarki użytkowników (per-user z RPC) ---
  const userBenchmarksLast30d: AdminUserBenchmark[] = agg.perUser
    .map((u) => {
      const profile = profileMap.get(u.userId);
      return {
        userId: u.userId,
        displayName: profile?.displayName ?? "Użytkownik",
        track: profile ? TRACK_LABEL[profile.track] : null,
        trackKey: profile?.track ?? null,
        year: profile?.year ?? null,
        sessions: u.sessions30,
        questions: u.questions30,
        studyHours: Number((u.durationSec30 / 3600).toFixed(1)),
        avgAccuracy:
          u.sessions30 > 0
            ? Number(((u.accSum30 / u.sessions30) * 100).toFixed(1))
            : 0,
        totalPlatformMinutes: Number((u.durationSec30 / 60).toFixed(1)),
        totalTestMinutes: Number((u.testDurationSec30 / 60).toFixed(1)),
        avgTestDurationMinutes:
          u.testSessions30 > 0
            ? Number(((u.testDurationSec30 / 60) / u.testSessions30).toFixed(1))
            : 0,
      };
    })
    .sort((a, b) => {
      if (b.sessions !== a.sessions) return b.sessions - a.sessions;
      return b.studyHours - a.studyHours;
    });

  // --- Benchmarki kohort (kierunek × rok, z profili + per-user) ---
  const cohortAggMap = new Map<
    string,
    {
      trackKey: TrackKey;
      year: number | null;
      headcount: number;
      activeCount: number;
      paidCount: number;
      platformSec: number;
      testSec: number;
      testSessions: number;
      accSum: number;
      accCount: number;
    }
  >();
  for (const [uid, profile] of profileMap) {
    const key = `${profile.track}|${profile.year ?? "-"}`;
    const bucket = cohortAggMap.get(key) ?? {
      trackKey: profile.track,
      year: profile.year,
      headcount: 0,
      activeCount: 0,
      paidCount: 0,
      platformSec: 0,
      testSec: 0,
      testSessions: 0,
      accSum: 0,
      accCount: 0,
    };
    bucket.headcount += 1;
    if (activeUsersSet30d.has(uid)) bucket.activeCount += 1;
    if (profile.subscription === "active") bucket.paidCount += 1;
    const stats = userStatMap.get(uid);
    if (stats) {
      bucket.platformSec += stats.durationSec30;
      bucket.testSec += stats.testDurationSec30;
      bucket.testSessions += stats.testSessions30;
      bucket.accSum += stats.accSum30;
      bucket.accCount += stats.sessions30;
    }
    cohortAggMap.set(key, bucket);
  }
  const cohortBenchmarksLast30d: AdminCohortBenchmark[] = Array.from(
    cohortAggMap.values(),
  )
    .map((bucket) => {
      const headcount = bucket.headcount;
      const activeOrAll = bucket.activeCount > 0 ? bucket.activeCount : Math.max(headcount, 1);
      return {
        trackKey: bucket.trackKey,
        trackLabel: TRACK_LABEL[bucket.trackKey],
        year: bucket.year,
        label: trackYearLabel(bucket.trackKey, bucket.year),
        headcount,
        activeCount: bucket.activeCount,
        paidCount: bucket.paidCount,
        paidPct:
          headcount > 0
            ? Number(((bucket.paidCount / headcount) * 100).toFixed(1))
            : 0,
        avgPlatformMinutes: Number(((bucket.platformSec / 60) / activeOrAll).toFixed(1)),
        avgTestMinutes: Number(((bucket.testSec / 60) / activeOrAll).toFixed(1)),
        avgTestDurationMinutes:
          bucket.testSessions > 0
            ? Number(((bucket.testSec / 60) / bucket.testSessions).toFixed(1))
            : 0,
        avgAccuracy:
          bucket.accCount > 0
            ? Number(((bucket.accSum / bucket.accCount) * 100).toFixed(1))
            : 0,
      };
    })
    .sort((a, b) => {
      if (a.trackKey !== b.trackKey) {
        return TRACK_LABEL[a.trackKey].localeCompare(TRACK_LABEL[b.trackKey]);
      }
      return (a.year ?? 99) - (b.year ?? 99);
    });

  return {
    totalQuestions,
    totalUsers: allProfiles.length,
    paidUsers,
    pendingReports,
    sessionsToday: agg.sessionsToday,
    sessionsLast7d,
    sessionsLast30d,
    answeredQuestionsLast7d,
    answeredQuestionsLast30d,
    answeredQuestionsPrev7d,
    completedTestsLast7d: agg.completedTests7d,
    averageAccuracyLast7d,
    averageAccuracyLast30d,
    studyHoursLast7d,
    studyHoursLast30d,
    studyHoursPrev7d,
    averageSessionMinutesLast7d,
    uniqueActiveUsersLast7d,
    uniqueActiveUsersLast30d,
    uniqueActiveUsersPrev7d,
    sessionsPrev7d,
    newRegistrationsLast7d,
    newRegistrationsLast30d,
    peakHour,
    peakDayOfWeek,
    topUser,
    userSegments,
    hourOfDayLast30d,
    dayOfWeekLast30d,
    heatmapLast30d,
    heatmapMaxSessions,
    subjectPopularityLast30d,
    trackPerformanceLast30d,
    engagementLast30d,
    subscriptionBreakdown,
    registrationsLast30d,
    modeBreakdownLast7d,
    dailyTrendLast14d,
    userBenchmarksLast30d,
    cohortBenchmarksLast30d,
  };
}
