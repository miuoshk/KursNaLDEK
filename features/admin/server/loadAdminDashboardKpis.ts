import "server-only";

import {
  getNewRegistrationsCountSince,
  getPaidUsersCount,
  getPendingReportsCount,
  getSessionAnswersCountSince,
  getStudySessionsLast30d,
  getTotalUsersCount,
  type SharedSessionRow,
} from "@/features/admin/server/loadAdminShared";

const DOW_LABELS = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];

export type AdminDashboardKpiData = {
  totalUsers: number;
  paidUsers: number;
  pendingReports: number;
  sessionsToday: number;
  sessionsLast7d: number;
  sessionsLast30d: number;
  answeredQuestionsLast7d: number;
  answeredQuestionsLast30d: number;
  answeredQuestionsPrev7d: number;
  averageAccuracyLast7d: number;
  averageAccuracyLast30d: number;
  studyHoursLast7d: number;
  studyHoursLast30d: number;
  studyHoursPrev7d: number;
  uniqueActiveUsersLast7d: number;
  uniqueActiveUsersLast30d: number;
  uniqueActiveUsersPrev7d: number;
  sessionsPrev7d: number;
  newRegistrationsLast7d: number;
  peakHour: { hour: number; sessions: number } | null;
  peakDayOfWeek: { dow: number; label: string; sessions: number } | null;
};

function safeAccuracy(row: SharedSessionRow): number {
  const explicit = row.accuracy;
  if (typeof explicit === "number") return explicit;
  const totalQ = row.total_questions ?? 0;
  const correct = row.correct_answers ?? 0;
  return totalQ > 0 ? correct / totalQ : 0;
}

function hourFromIso(iso: string): number {
  return new Date(iso).getHours();
}

function dowFromIso(iso: string): number {
  return new Date(iso).getDay();
}

/** Szybkie KPI dashboardu — liczniki head-only + sesje z 30 dni (bez pełnej analityki). */
export async function loadAdminDashboardKpis(): Promise<AdminDashboardKpiData> {
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
    sessions30d,
    totalUsers,
    paidUsers,
    pendingReports,
    answersCount7d,
    answersCount30d,
    answersCount14d,
    newRegistrationsLast7d,
  ] = await Promise.all([
    getStudySessionsLast30d(),
    getTotalUsersCount(),
    getPaidUsersCount(),
    getPendingReportsCount(),
    getSessionAnswersCountSince(since7d),
    getSessionAnswersCountSince(since30d),
    getSessionAnswersCountSince(since14d),
    getNewRegistrationsCountSince(since7d),
  ]);

  const sessions7d = sessions30d.filter(
    (row) => row.started_at !== null && new Date(row.started_at).getTime() >= since7dMs,
  );
  const sessionsInPrev7d = sessions30d.filter((row) => {
    if (!row.started_at) return false;
    const t = new Date(row.started_at).getTime();
    return t >= since14dMs && t < since7dMs;
  });

  const sessionsToday = sessions30d.filter((row) => {
    if (!row.started_at) return false;
    return new Date(row.started_at).getTime() >= todayMs;
  }).length;

  const sessionsLast7d = sessions7d.length;
  const sessionsLast30d = sessions30d.length;
  const sessionsPrev7d = sessionsInPrev7d.length;

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
  for (const row of sessions30d) {
    if (!row.user_id) continue;
    activeUsersSet30d.add(row.user_id);
    const t = row.started_at ? new Date(row.started_at).getTime() : 0;
    if (t >= since7dMs) activeUsersSet7d.add(row.user_id);
    if (t >= since14dMs && t < since7dMs) activeUsersSetPrev7d.add(row.user_id);
  }

  const hourCounts = new Map<number, number>();
  const dowCounts = new Map<number, number>();
  for (const row of sessions30d) {
    if (!row.started_at) continue;
    const startedMs = new Date(row.started_at).getTime();
    if (startedMs < since30dMs) continue;
    const hour = hourFromIso(row.started_at);
    const dow = dowFromIso(row.started_at);
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    dowCounts.set(dow, (dowCounts.get(dow) ?? 0) + 1);
  }

  let peakHour: AdminDashboardKpiData["peakHour"] = null;
  for (const [hour, sessions] of hourCounts) {
    if (!peakHour || sessions > peakHour.sessions) {
      peakHour = { hour, sessions };
    }
  }
  if (peakHour && peakHour.sessions === 0) peakHour = null;

  let peakDayOfWeek: AdminDashboardKpiData["peakDayOfWeek"] = null;
  for (const [dow, sessions] of dowCounts) {
    if (!peakDayOfWeek || sessions > peakDayOfWeek.sessions) {
      peakDayOfWeek = { dow, label: DOW_LABELS[dow]!, sessions };
    }
  }
  if (peakDayOfWeek && peakDayOfWeek.sessions === 0) peakDayOfWeek = null;

  return {
    totalUsers,
    paidUsers,
    pendingReports,
    sessionsToday,
    sessionsLast7d,
    sessionsLast30d,
    answeredQuestionsLast7d: answersCount7d,
    answeredQuestionsLast30d: answersCount30d,
    answeredQuestionsPrev7d: Math.max(0, answersCount14d - answersCount7d),
    averageAccuracyLast7d,
    averageAccuracyLast30d,
    studyHoursLast7d: Number((totalDurationSec7d / 3600).toFixed(1)),
    studyHoursLast30d: Number((totalDurationSec30d / 3600).toFixed(1)),
    studyHoursPrev7d: Number((totalDurationSecPrev7d / 3600).toFixed(1)),
    uniqueActiveUsersLast7d: activeUsersSet7d.size,
    uniqueActiveUsersLast30d: activeUsersSet30d.size,
    uniqueActiveUsersPrev7d: activeUsersSetPrev7d.size,
    sessionsPrev7d,
    newRegistrationsLast7d,
    peakHour,
    peakDayOfWeek,
  };
}
