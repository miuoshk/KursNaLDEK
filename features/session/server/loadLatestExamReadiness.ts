import type { SupabaseClient } from "@supabase/supabase-js";
import { parseStoredSessionInsights } from "@/features/session/lib/parseStoredSessionInsights";
import type { ExamReadinessSnapshot } from "@/features/session/summaryTypes";

/** Ostatni zapisany snapshot gotowości (metryka globalna z ANTARES). */
export async function loadLatestExamReadiness(
  supabase: SupabaseClient,
  userId: string,
): Promise<ExamReadinessSnapshot | null> {
  const { data } = await supabase
    .from("study_sessions")
    .select("session_insights")
    .eq("user_id", userId)
    .eq("is_completed", true)
    .order("completed_at", { ascending: false })
    .limit(12);

  for (const row of data ?? []) {
    const parsed = parseStoredSessionInsights(row.session_insights);
    if (parsed.examReadiness) return parsed.examReadiness;
  }
  return null;
}
