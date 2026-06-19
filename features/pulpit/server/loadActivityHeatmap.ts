import type { SupabaseClient } from "@supabase/supabase-js";

const DAYS_BACK = 91;

export type ActivityDay = { day: string; count: number };

export async function loadActivityHeatmap(
  supabase: SupabaseClient,
  userId: string,
): Promise<ActivityDay[]> {
  // Agregacja po dniu (strefa Warszawa) liczona w bazie — wcześniej ciągnęliśmy
  // wszystkie answered_at z 91 dni (u aktywnych userów dziesiątki tysięcy
  // wierszy) i liczyliśmy per dzień w JS.
  const { data, error } = await supabase.rpc("pulpit_activity_heatmap", {
    p_user_id: userId,
    p_days: DAYS_BACK,
  });

  if (error) {
    console.error("[loadActivityHeatmap]", error.message);
    return [];
  }

  return ((data ?? []) as { day: string; count: number }[]).map((r) => ({
    day: r.day,
    count: Number(r.count ?? 0),
  }));
}
