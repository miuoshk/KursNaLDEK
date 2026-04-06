import type { SupabaseClient } from "@supabase/supabase-js";

function warsawYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export async function countSessionAnswersTodayWarsaw(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const todayYmd = warsawYmd(new Date());
  const { data: todayRows } = await supabase
    .from("session_answers")
    .select("answered_at, study_sessions!inner ( user_id )")
    .eq("study_sessions.user_id", userId)
    .gte("answered_at", new Date(Date.now() - 50 * 3600 * 1000).toISOString());

  let n = 0;
  for (const row of todayRows ?? []) {
    const at = row.answered_at as string;
    if (warsawYmd(new Date(at)) === todayYmd) n += 1;
  }
  return n;
}
