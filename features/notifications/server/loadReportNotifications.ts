import { createClient } from "@/lib/supabase/server";
import type { ReportNotification } from "@/features/notifications/types";

const RESOLVED_STATUSES = ["resolved", "rejected", "reviewed"] as const;

export async function loadReportNotifications(
  unreadOnly = false,
): Promise<ReportNotification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from("error_reports")
    .select("id, question_id, category, status, admin_response, resolved_at")
    .eq("user_id", user.id)
    .in("status", [...RESOLVED_STATUSES])
    .not("resolved_at", "is", null)
    .order("resolved_at", { ascending: false })
    .limit(20);

  if (unreadOnly) {
    query = query.is("notification_read_at", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[loadReportNotifications]", error.message);
    return [];
  }

  return (data ?? [])
    .filter(
      (row): row is typeof row & { resolved_at: string } =>
        typeof row.resolved_at === "string",
    )
    .map((row) => ({
      id: row.id as string,
      questionId: row.question_id as string,
      category: row.category as string,
      status: row.status as ReportNotification["status"],
      adminResponse: (row.admin_response as string | null) ?? null,
      resolvedAt: row.resolved_at,
    }));
}
