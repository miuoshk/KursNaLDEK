import type { SupabaseClient } from "@supabase/supabase-js";

const DAYS_BACK = 91;

function toWarsawYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export type ActivityDay = { day: string; count: number };

export async function loadActivityHeatmap(
  supabase: SupabaseClient,
  userId: string,
): Promise<ActivityDay[]> {
  const cutoff = new Date(Date.now() - DAYS_BACK * 24 * 3600 * 1000);

  const { data: rows } = await supabase
    .from("session_answers")
    .select("answered_at, study_sessions!inner(user_id)")
    .eq("study_sessions.user_id", userId)
    .gte("answered_at", cutoff.toISOString());

  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    const ymd = toWarsawYmd(new Date(row.answered_at as string));
    counts.set(ymd, (counts.get(ymd) ?? 0) + 1);
  }

  return Array.from(counts, ([day, count]) => ({ day, count })).sort(
    (a, b) => a.day.localeCompare(b.day),
  );
}
