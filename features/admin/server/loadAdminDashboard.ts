import { createClient } from "@/lib/supabase/server";

export type AdminDashboardData = {
  totalQuestions: number;
  totalUsers: number;
  pendingReports: number;
  sessionsToday: number;
  sessionsLast7d: number;
  answeredQuestionsLast7d: number;
  completedTestsLast7d: number;
  averageAccuracyLast7d: number;
  studyHoursLast7d: number;
  averageSessionMinutesLast7d: number;
  uniqueActiveUsersLast7d: number;
  topUser: { displayName: string; sessionCount: number } | null;
  modeBreakdownLast7d: Array<{
    mode: string;
    sessions: number;
    sharePct: number;
    avgAccuracy: number;
    avgDurationMin: number;
  }>;
  dailyTrendLast14d: Array<{
    date: string;
    sessions: number;
    users: number;
    questions: number;
    studyHours: number;
    avgAccuracy: number;
  }>;
  userBenchmarksLast30d: Array<{
    userId: string;
    displayName: string;
    sessions: number;
    questions: number;
    studyHours: number;
    avgAccuracy: number;
  }>;
};

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const supabase = await createClient();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayIso = startOfToday.toISOString();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [questionsRes, usersRes, reportsRes, sessionsTodayRes, sessions7dRes, sessions30dRes] = await Promise.all([
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("error_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("study_sessions")
      .select("id", { count: "exact", head: true })
      .gte("started_at", todayIso),
    supabase
      .from("study_sessions")
      .select(
        "id, user_id, mode, total_questions, correct_answers, duration_seconds, accuracy, started_at, completed_at, is_completed",
      )
      .gte("started_at", since7d),
    supabase
      .from("study_sessions")
      .select(
        "id, user_id, mode, total_questions, correct_answers, duration_seconds, accuracy, started_at, completed_at, is_completed",
      )
      .gte("started_at", since30d),
  ]);

  const { data: topUserRow } = await supabase
    .from("study_sessions")
    .select("user_id")
    .gte("started_at", todayIso)
    .limit(500);

  let topUser: AdminDashboardData["topUser"] = null;
  if (topUserRow && topUserRow.length > 0) {
    const counts = new Map<string, number>();
    for (const r of topUserRow) {
      const uid = r.user_id as string;
      counts.set(uid, (counts.get(uid) ?? 0) + 1);
    }
    let maxUid = "";
    let maxCount = 0;
    for (const [uid, c] of counts) {
      if (c > maxCount) {
        maxUid = uid;
        maxCount = c;
      }
    }
    if (maxUid) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", maxUid)
        .maybeSingle();
      topUser = {
        displayName: (profile?.display_name as string) ?? "Nieznany",
        sessionCount: maxCount,
      };
    }
  }

  const sessions7d = sessions7dRes.data ?? [];
  const sessions30d = sessions30dRes.data ?? [];
  const sessionsLast7d = sessions7d.length;
  const answeredQuestionsLast7d = sessions7d.reduce(
    (sum, row) => sum + ((row.total_questions as number | null) ?? 0),
    0,
  );
  const completedTestsLast7d = sessions7d.filter(
    (row) =>
      (row.is_completed as boolean | null) === true ||
      (row.completed_at as string | null) !== null,
  ).length;
  const totalDurationSec7d = sessions7d.reduce(
    (sum, row) => sum + ((row.duration_seconds as number | null) ?? 0),
    0,
  );
  const studyHoursLast7d = Number((totalDurationSec7d / 3600).toFixed(1));
  const averageSessionMinutesLast7d =
    sessionsLast7d > 0 ? Number(((totalDurationSec7d / 60) / sessionsLast7d).toFixed(1)) : 0;

  const totalAccuracy7d = sessions7d.reduce((sum, row) => {
    const explicit = row.accuracy as number | null;
    if (typeof explicit === "number") return sum + explicit;
    const totalQ = (row.total_questions as number | null) ?? 0;
    const correctQ = (row.correct_answers as number | null) ?? 0;
    return sum + (totalQ > 0 ? correctQ / totalQ : 0);
  }, 0);
  const averageAccuracyLast7d =
    sessionsLast7d > 0 ? Number(((totalAccuracy7d / sessionsLast7d) * 100).toFixed(1)) : 0;

  const activeUsersSet7d = new Set<string>();
  for (const row of sessions7d) {
    const userId = row.user_id as string | null;
    if (userId) activeUsersSet7d.add(userId);
  }
  const uniqueActiveUsersLast7d = activeUsersSet7d.size;

  const modeMap = new Map<string, {
    sessions: number;
    totalAccuracy: number;
    totalDurationSec: number;
  }>();
  for (const row of sessions7d) {
    const mode = ((row.mode as string | null) ?? "nieznany").toLowerCase();
    const totalQ = (row.total_questions as number | null) ?? 0;
    const correctQ = (row.correct_answers as number | null) ?? 0;
    const acc =
      typeof (row.accuracy as number | null) === "number"
        ? (row.accuracy as number)
        : totalQ > 0
          ? correctQ / totalQ
          : 0;
    const prev = modeMap.get(mode) ?? { sessions: 0, totalAccuracy: 0, totalDurationSec: 0 };
    prev.sessions += 1;
    prev.totalAccuracy += acc;
    prev.totalDurationSec += (row.duration_seconds as number | null) ?? 0;
    modeMap.set(mode, prev);
  }

  const modeBreakdownLast7d = Array.from(modeMap.entries())
    .map(([mode, stats]) => ({
      mode,
      sessions: stats.sessions,
      sharePct: sessionsLast7d > 0 ? Number(((stats.sessions / sessionsLast7d) * 100).toFixed(1)) : 0,
      avgAccuracy: stats.sessions > 0 ? Number(((stats.totalAccuracy / stats.sessions) * 100).toFixed(1)) : 0,
      avgDurationMin: stats.sessions > 0 ? Number(((stats.totalDurationSec / 60) / stats.sessions).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);

  const trendMap = new Map<string, {
    sessions: number;
    users: Set<string>;
    questions: number;
    durationSec: number;
    accuracySum: number;
  }>();
  for (const row of sessions30d) {
    const startedAt = row.started_at as string | null;
    if (!startedAt) continue;
    if (new Date(startedAt).getTime() < new Date(since14d).getTime()) continue;
    const day = startedAt.slice(0, 10);
    const totalQ = (row.total_questions as number | null) ?? 0;
    const correctQ = (row.correct_answers as number | null) ?? 0;
    const acc =
      typeof (row.accuracy as number | null) === "number"
        ? (row.accuracy as number)
        : totalQ > 0
          ? correctQ / totalQ
          : 0;

    const current = trendMap.get(day) ?? {
      sessions: 0,
      users: new Set<string>(),
      questions: 0,
      durationSec: 0,
      accuracySum: 0,
    };
    current.sessions += 1;
    const userId = row.user_id as string | null;
    if (userId) current.users.add(userId);
    current.questions += totalQ;
    current.durationSec += (row.duration_seconds as number | null) ?? 0;
    current.accuracySum += acc;
    trendMap.set(day, current);
  }

  const dailyTrendLast14d = Array.from(trendMap.entries())
    .map(([date, stats]) => ({
      date,
      sessions: stats.sessions,
      users: stats.users.size,
      questions: stats.questions,
      studyHours: Number((stats.durationSec / 3600).toFixed(1)),
      avgAccuracy: stats.sessions > 0 ? Number(((stats.accuracySum / stats.sessions) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const userBenchMap = new Map<string, {
    sessions: number;
    questions: number;
    durationSec: number;
    accuracySum: number;
  }>();
  for (const row of sessions30d) {
    const userId = row.user_id as string | null;
    if (!userId) continue;
    const totalQ = (row.total_questions as number | null) ?? 0;
    const correctQ = (row.correct_answers as number | null) ?? 0;
    const acc =
      typeof (row.accuracy as number | null) === "number"
        ? (row.accuracy as number)
        : totalQ > 0
          ? correctQ / totalQ
          : 0;
    const current = userBenchMap.get(userId) ?? {
      sessions: 0,
      questions: 0,
      durationSec: 0,
      accuracySum: 0,
    };
    current.sessions += 1;
    current.questions += totalQ;
    current.durationSec += (row.duration_seconds as number | null) ?? 0;
    current.accuracySum += acc;
    userBenchMap.set(userId, current);
  }

  const benchmarkUserIds = Array.from(userBenchMap.keys());
  const profileNameMap = new Map<string, string>();
  if (benchmarkUserIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", benchmarkUserIds);
    for (const row of profileRows ?? []) {
      profileNameMap.set(row.id as string, (row.display_name as string | null) ?? "Użytkownik");
    }
  }

  const userBenchmarksLast30d = Array.from(userBenchMap.entries())
    .map(([userId, stats]) => ({
      userId,
      displayName: profileNameMap.get(userId) ?? "Użytkownik",
      sessions: stats.sessions,
      questions: stats.questions,
      studyHours: Number((stats.durationSec / 3600).toFixed(1)),
      avgAccuracy: stats.sessions > 0 ? Number(((stats.accuracySum / stats.sessions) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => {
      if (b.sessions !== a.sessions) return b.sessions - a.sessions;
      return b.studyHours - a.studyHours;
    })
    .slice(0, 12);

  return {
    totalQuestions: questionsRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
    pendingReports: reportsRes.count ?? 0,
    sessionsToday: sessionsTodayRes.count ?? 0,
    sessionsLast7d,
    answeredQuestionsLast7d,
    completedTestsLast7d,
    averageAccuracyLast7d,
    studyHoursLast7d,
    averageSessionMinutesLast7d,
    uniqueActiveUsersLast7d,
    topUser,
    modeBreakdownLast7d,
    dailyTrendLast14d,
    userBenchmarksLast30d,
  };
}
