import "server-only";

import {
  getDashboardSessionAggregates,
  getNewRegistrationsCountSince,
  getPaidUsersCount,
  getPendingReportsCount,
  getTotalUsersCount,
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

/** Szybkie KPI dashboardu — liczniki head-only + zagregowane metryki sesji z RPC. */
export async function loadAdminDashboardKpis(): Promise<AdminDashboardKpiData> {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [agg, totalUsers, paidUsers, pendingReports, newRegistrationsLast7d] =
    await Promise.all([
      getDashboardSessionAggregates(),
      getTotalUsersCount(),
      getPaidUsersCount(),
      getPendingReportsCount(),
      getNewRegistrationsCountSince(since7d),
    ]);

  const sessionsLast7d = agg.sessions7d;
  const sessionsLast30d = agg.sessions30d;

  const averageAccuracyLast7d =
    sessionsLast7d > 0
      ? Number(((agg.accSum7d / sessionsLast7d) * 100).toFixed(1))
      : 0;
  const averageAccuracyLast30d =
    sessionsLast30d > 0
      ? Number(((agg.accSum30d / sessionsLast30d) * 100).toFixed(1))
      : 0;

  let uniqueActiveUsersLast7d = 0;
  let uniqueActiveUsersLast30d = 0;
  let uniqueActiveUsersPrev7d = 0;
  for (const u of agg.perUser) {
    if (u.sessions30 > 0) uniqueActiveUsersLast30d += 1;
    if (u.sessions7 > 0) uniqueActiveUsersLast7d += 1;
    if (u.sessionsPrev7 > 0) uniqueActiveUsersPrev7d += 1;
  }

  let peakHour: AdminDashboardKpiData["peakHour"] = null;
  for (const bucket of agg.hour) {
    if (!peakHour || bucket.sessions > peakHour.sessions) {
      peakHour = { hour: bucket.hour, sessions: bucket.sessions };
    }
  }
  if (peakHour && peakHour.sessions === 0) peakHour = null;

  let peakDayOfWeek: AdminDashboardKpiData["peakDayOfWeek"] = null;
  for (const bucket of agg.dow) {
    if (!peakDayOfWeek || bucket.sessions > peakDayOfWeek.sessions) {
      peakDayOfWeek = {
        dow: bucket.dow,
        label: DOW_LABELS[bucket.dow]!,
        sessions: bucket.sessions,
      };
    }
  }
  if (peakDayOfWeek && peakDayOfWeek.sessions === 0) peakDayOfWeek = null;

  return {
    totalUsers,
    paidUsers,
    pendingReports,
    sessionsToday: agg.sessionsToday,
    sessionsLast7d,
    sessionsLast30d,
    answeredQuestionsLast7d: agg.answers7d,
    answeredQuestionsLast30d: agg.answers30d,
    answeredQuestionsPrev7d: Math.max(0, agg.answers14d - agg.answers7d),
    averageAccuracyLast7d,
    averageAccuracyLast30d,
    studyHoursLast7d: Number((agg.durationSec7d / 3600).toFixed(1)),
    studyHoursLast30d: Number((agg.durationSec30d / 3600).toFixed(1)),
    studyHoursPrev7d: Number((agg.durationSecPrev7d / 3600).toFixed(1)),
    uniqueActiveUsersLast7d,
    uniqueActiveUsersLast30d,
    uniqueActiveUsersPrev7d,
    sessionsPrev7d: agg.sessionsPrev7d,
    newRegistrationsLast7d,
    peakHour,
    peakDayOfWeek,
  };
}
