import type { SupabaseClient } from "@supabase/supabase-js";

const DAYS_BACK = 60;

function toWarsawYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export type ProgressPoint = {
  day: string;
  avgAccuracy: number;
  totalQuestions: number;
};

export async function loadProgressHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProgressPoint[]> {
  const cutoff = new Date(Date.now() - DAYS_BACK * 24 * 3600 * 1000);

  const { data: rows } = await supabase
    .from("study_sessions")
    .select("completed_at, accuracy, correct_answers, total_questions")
    .eq("user_id", userId)
    .eq("is_completed", true)
    .gte("completed_at", cutoff.toISOString())
    .order("completed_at", { ascending: true });

  const buckets = new Map<
    string,
    { sumAccuracy: number; count: number; totalQ: number }
  >();

  for (const row of rows ?? []) {
    const ymd = toWarsawYmd(new Date(row.completed_at as string));
    const cur = buckets.get(ymd) ?? { sumAccuracy: 0, count: 0, totalQ: 0 };
    const acc = row.accuracy as number | null;
    if (acc != null) {
      cur.sumAccuracy += acc;
      cur.count += 1;
    }
    cur.totalQ += Number(row.total_questions ?? 0);
    buckets.set(ymd, cur);
  }

  return Array.from(buckets, ([day, b]) => ({
    day,
    avgAccuracy: b.count > 0 ? Math.round((b.sumAccuracy / b.count) * 100) : 0,
    totalQuestions: b.totalQ,
  })).sort((a, b) => a.day.localeCompare(b.day));
}
