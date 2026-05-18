import { createClient } from "@/lib/supabase/server";

export type AdminSidebarBadges = {
  pendingReports: number;
  newDiscussions24h: number;
};

/**
 * Lekkie liczniki dla plakietek w sidebarze admina.
 * Tylko `count: "exact", head: true` — bez pobierania wierszy.
 */
export async function loadAdminSidebarBadges(): Promise<AdminSidebarBadges> {
  const supabase = await createClient();

  const since24hIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [reportsRes, discussionsRes] = await Promise.all([
    supabase
      .from("error_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("question_discussions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since24hIso),
  ]);

  return {
    pendingReports: reportsRes.count ?? 0,
    newDiscussions24h: discussionsRes.count ?? 0,
  };
}
