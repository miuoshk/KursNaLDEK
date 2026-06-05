import "server-only";

import {
  getAllErrorReports,
  getAllProfiles,
  getAllSubjects,
  getSessionAnswersCountSince,
  getStudySessionsLast90d,
  getTotalQuestionsCount,
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

function dowFromIso(iso: string): number {
  return new Date(iso).getDay();
}

function hourFromIso(iso: string): number {
  return new Date(iso).getHours();
}

function safeAccuracy(row: SessionRow): number {
  const explicit = row.accuracy;
  if (typeof explicit === "number") return explicit;
  const totalQ = row.total_questions ?? 0;
  const correctQ = row.correct_answers ?? 0;
  return totalQ > 0 ? correctQ / totalQ : 0;
}

type SessionRow = {
  id: string;
  user_id: string | null;
  subject_id: string | null;
  mode: string | null;
  total_questions: number | null;
  correct_answers: number | null;
  accuracy: number | null;
  duration_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  is_completed: boolean | null;
};

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since7dMs = new Date(since7d).getTime();
  const since14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const since14dMs = new Date(since14d).getTime();
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since30dMs = new Date(since30d).getTime();

  const [
    totalQuestions,
    allSessions,
    allProfiles,
    allSubjects,
    allReports,
    answersCount7d,
    answersCount30d,
    answersCount14d,
  ] = await Promise.all([
    getTotalQuestionsCount(),
    getStudySessionsLast90d(),
    getAllProfiles(),
    getAllSubjects(),
    getAllErrorReports(),
    getSessionAnswersCountSince(since7d),
    getSessionAnswersCountSince(since30d),
    getSessionAnswersCountSince(since14d),
  ]);
  const answeredQuestionsLast7d = answersCount7d;
  const answeredQuestionsLast30d = answersCount30d;
  const answeredQuestionsPrev7d = Math.max(0, answersCount14d - answersCount7d);

  const sessions30d = allSessions.filter((row) => {
    if (!row.started_at) return false;
    return new Date(row.started_at).getTime() >= since30dMs;
  }) as SessionRow[];

  const profiles = allProfiles;
  const subjects = allSubjects;

  const sessionsToday = allSessions.filter((row) => {
    if (!row.started_at) return false;
    return new Date(row.started_at).getTime() >= todayMs;
  }).length;

  const paidUsers = profiles.filter(
    (p) => p.subscription_status === "active",
  ).length;

  const pendingReports = allReports.filter((r) => r.status === "pending").length;

  const subjectMap = new Map<
    string,
    { name: string; shortName: string; track: string | null; year: number | null }
  >();
  for (const s of subjects) {
    const name = (s.name as string) ?? (s.id as string);
    subjectMap.set(s.id as string, {
      name,
      shortName: ((s.short_name as string | null) ?? name).trim(),
      track: (s.track as string | null) ?? null,
      year: (s.year as number | null) ?? null,
    });
  }

  const profileMap = new Map<
    string,
    {
      displayName: string;
      track: TrackKey;
      year: number | null;
      xp: number;
      streak: number;
      subscription: string | null;
      createdAt: string | null;
    }
  >();
  for (const p of profiles) {
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

  const sessions7d = sessions30d.filter(
    (row) => row.started_at !== null && new Date(row.started_at).getTime() >= since7dMs,
  );
  const sessionsInPrev7d = sessions30d.filter((row) => {
    if (!row.started_at) return false;
    const t = new Date(row.started_at).getTime();
    return t >= since14dMs && t < since7dMs;
  });

  const sessionsLast7d = sessions7d.length;
  const sessionsLast30d = sessions30d.length;
  const sessionsPrev7d = sessionsInPrev7d.length;
  const completedTestsLast7d = sessions7d.filter(
    (row) => row.is_completed === true || row.completed_at !== null,
  ).length;

  const totalDurationSec7d = sessions7d.reduce(
    (sum, row) => sum + (row.duration_seconds ?? 0),
    0,
  );
  const totalDurationSec30d = sessions30d.reduce(
    (sum, row) => sum + (row.duration_seconds ?? 0),
    0,
  );
  const totalDurationSecPrev7d = sessionsInPrev7d.reduce(
    (sum, row) => sum + (row.duration_seconds ?? 0),
    0,
  );
  const studyHoursLast7d = Number((totalDurationSec7d / 3600).toFixed(1));
  const studyHoursLast30d = Number((totalDurationSec30d / 3600).toFixed(1));
  const studyHoursPrev7d = Number((totalDurationSecPrev7d / 3600).toFixed(1));
  const averageSessionMinutesLast7d =
    sessionsLast7d > 0
      ? Number(((totalDurationSec7d / 60) / sessionsLast7d).toFixed(1))
      : 0;

  const totalAccuracy7d = sessions7d.reduce((sum, row) => sum + safeAccuracy(row), 0);
  const averageAccuracyLast7d =
    sessionsLast7d > 0
      ? Number(((totalAccuracy7d / sessionsLast7d) * 100).toFixed(1))
      : 0;
  const totalAccuracy30d = sessions30d.reduce((sum, row) => sum + safeAccuracy(row), 0);
  const averageAccuracyLast30d =
    sessionsLast30d > 0
      ? Number(((totalAccuracy30d / sessionsLast30d) * 100).toFixed(1))
      : 0;

  const activeUsersSet7d = new Set<string>();
  const activeUsersSet30d = new Set<string>();
  const activeUsersSetPrev7d = new Set<string>();
  const userSessionCounts30d = new Map<string, number>();
  for (const row of sessions30d) {
    if (!row.user_id) continue;
    activeUsersSet30d.add(row.user_id);
    userSessionCounts30d.set(
      row.user_id,
      (userSessionCounts30d.get(row.user_id) ?? 0) + 1,
    );
  }
  for (const row of sessions7d) {
    if (row.user_id) activeUsersSet7d.add(row.user_id);
  }
  for (const row of sessionsInPrev7d) {
    if (row.user_id) activeUsersSetPrev7d.add(row.user_id);
  }
  const uniqueActiveUsersLast7d = activeUsersSet7d.size;
  const uniqueActiveUsersLast30d = activeUsersSet30d.size;
  const uniqueActiveUsersPrev7d = activeUsersSetPrev7d.size;

  let topUser: AdminDashboardData["topUser"] = null;
  let topUid = "";
  let topCount = 0;
  for (const [uid, c] of userSessionCounts30d) {
    if (c > topCount) {
      topCount = c;
      topUid = uid;
    }
  }
  if (topUid) {
    const profile = profileMap.get(topUid);
    topUser = {
      displayName: profile?.displayName ?? "Użytkownik",
      sessionCount: topCount,
    };
  }

  const newRegistrationsLast7d = profiles.filter((p) => {
    const created = p.created_at as string | null;
    return created !== null && new Date(created).getTime() >= new Date(since7d).getTime();
  }).length;
  const newRegistrationsLast30d = profiles.filter((p) => {
    const created = p.created_at as string | null;
    return created !== null && new Date(created).getTime() >= new Date(since30d).getTime();
  }).length;

  const userCompletedTests30d = new Map<string, number>();
  for (const row of sessions30d) {
    if (!row.user_id) continue;
    if (row.is_completed !== true && row.completed_at === null) continue;
    userCompletedTests30d.set(
      row.user_id,
      (userCompletedTests30d.get(row.user_id) ?? 0) + 1,
    );
  }

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
    bucket.count += 1;
    bucket.completedTestsSum += userCompletedTests30d.get(uid) ?? 0;
    if (activeUsersSet7d.has(uid)) bucket.activeIds7.add(uid);
    if (activeUsersSet30d.has(uid)) bucket.activeIds30.add(uid);
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

  const hourBuckets = new Map<
    number,
    { sessions: number; questions: number; accSum: number }
  >();
  const dowBuckets = new Map<
    number,
    { sessions: number; questions: number; accSum: number }
  >();
  const heatmapMap = new Map<string, number>();

  for (const row of sessions30d) {
    if (!row.started_at) continue;
    const hour = hourFromIso(row.started_at);
    const dow = dowFromIso(row.started_at);
    const acc = safeAccuracy(row);
    const totalQ = row.total_questions ?? 0;

    const h = hourBuckets.get(hour) ?? { sessions: 0, questions: 0, accSum: 0 };
    h.sessions += 1;
    h.questions += totalQ;
    h.accSum += acc;
    hourBuckets.set(hour, h);

    const d = dowBuckets.get(dow) ?? { sessions: 0, questions: 0, accSum: 0 };
    d.sessions += 1;
    d.questions += totalQ;
    d.accSum += acc;
    dowBuckets.set(dow, d);

    const key = `${dow}-${hour}`;
    heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + 1);
  }

  const hourOfDayLast30d: AdminHourBucket[] = Array.from({ length: 24 }, (_, hour) => {
    const stats = hourBuckets.get(hour);
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

  const dayOfWeekLast30d: AdminDayOfWeekBucket[] = Array.from({ length: 7 }, (_, idx) => {
    const dow = (idx + 1) % 7; // Pn=1..Nd=0 -> ułożone Pn..Nd
    const stats = dowBuckets.get(dow);
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

  let heatmapMaxSessions = 0;
  for (const v of heatmapMap.values()) {
    if (v > heatmapMaxSessions) heatmapMaxSessions = v;
  }
  const heatmapLast30d: AdminHeatmapCell[] = [];
  for (let dowIdx = 0; dowIdx < 7; dowIdx += 1) {
    const dow = (dowIdx + 1) % 7;
    for (let hour = 0; hour < 24; hour += 1) {
      const sessions = heatmapMap.get(`${dow}-${hour}`) ?? 0;
      const intensity =
        heatmapMaxSessions > 0 ? sessions / heatmapMaxSessions : 0;
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
      peakDayOfWeek = {
        dow: bucket.dow,
        label: bucket.label,
        sessions: bucket.sessions,
      };
    }
  }
  if (peakDayOfWeek && peakDayOfWeek.sessions === 0) peakDayOfWeek = null;

  const subjectMap30 = new Map<
    string,
    { sessions: number; questions: number; accSum: number }
  >();
  for (const row of sessions30d) {
    if (!row.subject_id) continue;
    const s = subjectMap30.get(row.subject_id) ?? { sessions: 0, questions: 0, accSum: 0 };
    s.sessions += 1;
    s.questions += row.total_questions ?? 0;
    s.accSum += safeAccuracy(row);
    subjectMap30.set(row.subject_id, s);
  }
  const subjectPopularityLast30d: AdminSubjectPopularity[] =
    mergeSubjectPopularityByShortName(
      Array.from(subjectMap30.entries()).map(([subjectId, stats]) => {
        const meta = subjectMap.get(subjectId);
        return {
          subjectId,
          subjectName: meta?.name ?? subjectId,
          shortName: meta?.shortName ?? subjectId,
          track: meta?.track ?? null,
          year: meta?.year ?? null,
          sessions: stats.sessions,
          questions: stats.questions,
          accSum: stats.accSum,
        };
      }),
      10,
    );

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
  for (const row of sessions30d) {
    if (!row.user_id) continue;
    const profile = profileMap.get(row.user_id);
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
    stats.sessions += 1;
    stats.questions += row.total_questions ?? 0;
    stats.accSum += safeAccuracy(row);
    stats.durationSec += row.duration_seconds ?? 0;
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

  const veryActiveThreshold = 5;
  let veryActive = 0;
  let active = 0;
  let inactive = 0;
  let neverStarted = 0;
  for (const uid of profileMap.keys()) {
    const c = userSessionCounts30d.get(uid) ?? 0;
    if (c >= veryActiveThreshold) veryActive += 1;
    else if (c >= 1) active += 1;
    else if (activeUsersSet30d.has(uid)) inactive += 1;
    else neverStarted += 1;
  }
  const totalUsersFromMap = profileMap.size;
  const engagementLast30d: AdminEngagement = {
    veryActive,
    active,
    inactive,
    neverStarted,
    totalUsers: totalUsersFromMap,
  };

  const registrationsMap = new Map<string, number>();
  for (const profile of profileMap.values()) {
    const created = profile.createdAt;
    if (!created) continue;
    if (new Date(created).getTime() < new Date(since30d).getTime()) continue;
    const day = created.slice(0, 10);
    registrationsMap.set(day, (registrationsMap.get(day) ?? 0) + 1);
  }
  const registrationsLast30d: AdminRegistrationsPoint[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const day = d.toISOString().slice(0, 10);
    registrationsLast30d.push({
      date: day,
      registrations: registrationsMap.get(day) ?? 0,
    });
  }

  const modeMap = new Map<
    string,
    { sessions: number; accSum: number; durationSec: number }
  >();
  for (const row of sessions7d) {
    const mode = ((row.mode as string | null) ?? "nieznany").toLowerCase();
    const stats = modeMap.get(mode) ?? { sessions: 0, accSum: 0, durationSec: 0 };
    stats.sessions += 1;
    stats.accSum += safeAccuracy(row);
    stats.durationSec += row.duration_seconds ?? 0;
    modeMap.set(mode, stats);
  }
  const modeBreakdownLast7d: AdminModeBenchmark[] = Array.from(modeMap.entries())
    .map(([mode, stats]) => ({
      mode,
      sessions: stats.sessions,
      sharePct:
        sessionsLast7d > 0
          ? Number(((stats.sessions / sessionsLast7d) * 100).toFixed(1))
          : 0,
      avgAccuracy:
        stats.sessions > 0
          ? Number(((stats.accSum / stats.sessions) * 100).toFixed(1))
          : 0,
      avgDurationMin:
        stats.sessions > 0
          ? Number(((stats.durationSec / 60) / stats.sessions).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);

  const trendMap = new Map<
    string,
    {
      sessions: number;
      users: Set<string>;
      questions: number;
      durationSec: number;
      accSum: number;
    }
  >();
  for (const row of sessions30d) {
    if (!row.started_at) continue;
    if (new Date(row.started_at).getTime() < new Date(since14d).getTime()) continue;
    const day = row.started_at.slice(0, 10);
    const current = trendMap.get(day) ?? {
      sessions: 0,
      users: new Set<string>(),
      questions: 0,
      durationSec: 0,
      accSum: 0,
    };
    current.sessions += 1;
    if (row.user_id) current.users.add(row.user_id);
    current.questions += row.total_questions ?? 0;
    current.durationSec += row.duration_seconds ?? 0;
    current.accSum += safeAccuracy(row);
    trendMap.set(day, current);
  }
  const dailyTrendLast14d: AdminDailyTrendPoint[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const day = d.toISOString().slice(0, 10);
    const stats = trendMap.get(day);
    dailyTrendLast14d.push({
      date: day,
      sessions: stats?.sessions ?? 0,
      users: stats?.users.size ?? 0,
      questions: stats?.questions ?? 0,
      studyHours: Number(((stats?.durationSec ?? 0) / 3600).toFixed(1)),
      avgAccuracy:
        stats && stats.sessions > 0
          ? Number(((stats.accSum / stats.sessions) * 100).toFixed(1))
          : 0,
    });
  }

  const TEST_MODES = new Set(["inteligentna", "przeglad", "osce_topic"]);

  const userBenchMap = new Map<
    string,
    {
      sessions: number;
      questions: number;
      durationSec: number;
      accSum: number;
      testSessions: number;
      testDurationSec: number;
    }
  >();
  for (const row of sessions30d) {
    if (!row.user_id) continue;
    const stats = userBenchMap.get(row.user_id) ?? {
      sessions: 0,
      questions: 0,
      durationSec: 0,
      accSum: 0,
      testSessions: 0,
      testDurationSec: 0,
    };
    stats.sessions += 1;
    stats.questions += row.total_questions ?? 0;
    stats.durationSec += row.duration_seconds ?? 0;
    stats.accSum += safeAccuracy(row);
    const modeKey = ((row.mode as string | null) ?? "").toLowerCase();
    if (TEST_MODES.has(modeKey)) {
      stats.testSessions += 1;
      stats.testDurationSec += row.duration_seconds ?? 0;
    }
    userBenchMap.set(row.user_id, stats);
  }
  const userBenchmarksLast30d: AdminUserBenchmark[] = Array.from(userBenchMap.entries())
    .map(([userId, stats]) => {
      const profile = profileMap.get(userId);
      const totalPlatformMinutes = Number((stats.durationSec / 60).toFixed(1));
      const totalTestMinutes = Number((stats.testDurationSec / 60).toFixed(1));
      const avgTestDurationMinutes =
        stats.testSessions > 0
          ? Number(((stats.testDurationSec / 60) / stats.testSessions).toFixed(1))
          : 0;
      return {
        userId,
        displayName: profile?.displayName ?? "Użytkownik",
        track: profile ? TRACK_LABEL[profile.track] : null,
        trackKey: profile?.track ?? null,
        year: profile?.year ?? null,
        sessions: stats.sessions,
        questions: stats.questions,
        studyHours: Number((stats.durationSec / 3600).toFixed(1)),
        avgAccuracy:
          stats.sessions > 0
            ? Number(((stats.accSum / stats.sessions) * 100).toFixed(1))
            : 0,
        totalPlatformMinutes,
        totalTestMinutes,
        avgTestDurationMinutes,
      };
    })
    .sort((a, b) => {
      if (b.sessions !== a.sessions) return b.sessions - a.sessions;
      return b.studyHours - a.studyHours;
    });

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
    const stats = userBenchMap.get(uid);
    if (stats) {
      bucket.platformSec += stats.durationSec;
      bucket.testSec += stats.testDurationSec;
      bucket.testSessions += stats.testSessions;
      bucket.accSum += stats.accSum;
      bucket.accCount += stats.sessions;
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
    totalUsers: profiles.length,
    paidUsers,
    pendingReports,
    sessionsToday,
    sessionsLast7d,
    sessionsLast30d,
    answeredQuestionsLast7d,
    answeredQuestionsLast30d,
    answeredQuestionsPrev7d,
    completedTestsLast7d,
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
