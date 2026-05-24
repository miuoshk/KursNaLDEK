import type { SupabaseClient } from "@supabase/supabase-js";
import { warsawYmd } from "@/lib/datetime/warsawCalendar";

const DAYS_BACK = 91;

export type ActivityDay = { day: string; count: number };

export async function loadActivityHeatmap(
  supabase: SupabaseClient,
  userId: string,
): Promise<ActivityDay[]> {
  const cutoff = new Date(Date.now() - DAYS_BACK * 24 * 3600 * 1000);
  const cutoffIso = cutoff.toISOString();

  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("id")
    .eq("user_id", userId)
    .gte("started_at", cutoffIso);

  const sessionIds = (sessions ?? []).map((s) => s.id as string);
  if (sessionIds.length === 0) {
    return [];
  }

  const { data: rows } = await supabase
    .from("session_answers")
    .select("answered_at")
    .in("session_id", sessionIds)
    .gte("answered_at", cutoffIso);

  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    const ymd = warsawYmd(new Date(row.answered_at as string));
    counts.set(ymd, (counts.get(ymd) ?? 0) + 1);
  }

  return Array.from(counts, ([day, count]) => ({ day, count })).sort(
    (a, b) => a.day.localeCompare(b.day),
  );
}
