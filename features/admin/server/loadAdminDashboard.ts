import { createClient } from "@/lib/supabase/server";

export type AdminDashboardData = {
  totalQuestions: number;
  totalUsers: number;
  pendingReports: number;
  sessionsToday: number;
  topUser: { displayName: string; sessionCount: number } | null;
};

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [questionsRes, usersRes, reportsRes, sessionsRes] = await Promise.all([
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

  return {
    totalQuestions: questionsRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
    pendingReports: reportsRes.count ?? 0,
    sessionsToday: sessionsRes.count ?? 0,
    topUser,
  };
}
