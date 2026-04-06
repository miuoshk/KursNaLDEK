import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildAccuracyTrend,
  buildStudyTimeLast14,
  heatmap30,
  sessionsByLocalDate,
} from "@/features/statistics/server/computeAggregates";
import { masteryFromUqp } from "@/features/statistics/server/masteryFromUqp";
import type { StatisticsPayload, TimeRangeKey } from "@/features/statistics/types";

function rangeToDays(r: TimeRangeKey): number | null {
  if (r === "all") return null;
  return Number(r);
}

export async function loadStatistics(
  supabase: SupabaseClient,
  userId: string,
  range: TimeRangeKey,
): Promise<StatisticsPayload> {
  const days = rangeToDays(range);
  const since =
    days == null
      ? null
      : new Date(Date.now() - days * 86400000).toISOString();

  const heatmapSince = new Date(Date.now() - 30 * 86400000).toISOString();

  let sessQ = supabase
    .from("study_sessions")
    .select("completed_at, correct_answers, total_questions, duration_seconds")
    .eq("user_id", userId)
    .eq("is_completed", true);
  if (since) sessQ = sessQ.gte("completed_at", since);

  const heatQ = supabase
    .from("study_sessions")
    .select("completed_at, correct_answers, total_questions, duration_seconds")
    .eq("user_id", userId)
    .eq("is_completed", true)
    .gte("completed_at", heatmapSince);

  const uqpQ = supabase
    .from("user_question_progress")
    .select("question_id, times_answered, times_correct")
    .eq("user_id", userId);

  const profileQ = supabase
    .from("profiles")
    .select("xp, current_streak")
    .eq("id", userId)
    .maybeSingle();

  const [sessionsRes, heatSessionsRes, uqpRes, profileRes] = await Promise.all([
    sessQ,
    heatQ,
    uqpQ,
    profileQ,
  ]);

  const sessRows = sessionsRes.data ?? [];
  const byDay = sessionsByLocalDate(sessRows);

  const heatmap = heatmap30(sessionsByLocalDate(heatSessionsRes.data ?? []));

  const trendDays = range === "all" ? 30 : Math.min(days ?? 30, 30);
  const accuracyTrend = buildAccuracyTrend(byDay, trendDays);
  const studyTimePerDay = buildStudyTimeLast14(byDay);

  const totalStudyMinutes = Math.round(
    sessRows.reduce((s, x) => s + (x.duration_seconds ?? 0) / 60, 0),
  );
  const totalQuestionsAnswered = sessRows.reduce(
    (s, x) => s + (x.total_questions ?? 0),
    0,
  );

  const uqp = uqpRes.data ?? [];
  const profile = profileRes.data;

  const { subjectMastery, weakTopics, predictedReadiness } =
    await masteryFromUqp(supabase, uqp);

  return {
    range,
    accuracyTrend,
    studyTimePerDay,
    subjectMastery,
    weakTopics,
    predictedReadiness,
    readinessMargin: 0.05,
    totalQuestionsAnswered,
    totalStudyMinutes,
    currentStreak: profile?.current_streak ?? 0,
    xp: profile?.xp ?? 0,
    heatmap,
  };
}
