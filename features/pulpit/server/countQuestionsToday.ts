import type { SupabaseClient } from "@supabase/supabase-js";
import {
  recentWarsawDayCutoffIso,
  warsawYmd,
} from "@/lib/datetime/warsawCalendar";

export async function countSessionAnswersTodayWarsaw(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const todayYmd = warsawYmd(new Date());
  const cutoffIso = recentWarsawDayCutoffIso();

  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("id")
    .eq("user_id", userId)
    .gte("started_at", cutoffIso);

  const sessionIds = (sessions ?? []).map((s) => s.id as string);
  if (sessionIds.length === 0) {
    return 0;
  }

  const { data: rows } = await supabase
    .from("session_answers")
    .select("answered_at")
    .in("session_id", sessionIds)
    .gte("answered_at", cutoffIso);

  let n = 0;
  for (const row of rows ?? []) {
    if (warsawYmd(new Date(row.answered_at as string)) === todayYmd) {
      n += 1;
    }
  }
  return n;
}
