import type { SupabaseClient } from "@supabase/supabase-js";

const DAYS_BACK = 60;

export type ProgressPoint = {
  day: string;
  avgAccuracy: number;
  totalQuestions: number;
};

export async function loadProgressHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProgressPoint[]> {
  // Dzienne kubełki (strefa Warszawa) liczone w bazie zamiast pobierania
  // wszystkich ukończonych sesji z 60 dni i agregacji w JS.
  const { data, error } = await supabase.rpc("pulpit_progress_history", {
    p_user_id: userId,
    p_days: DAYS_BACK,
  });

  if (error) {
    console.error("[loadProgressHistory]", error.message);
    return [];
  }

  return (
    (data ?? []) as { day: string; avg_accuracy: number; total_questions: number }[]
  ).map((r) => ({
    day: r.day,
    avgAccuracy: Number(r.avg_accuracy ?? 0),
    totalQuestions: Number(r.total_questions ?? 0),
  }));
}
