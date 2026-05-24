import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildAccuracyTrend,
  buildStudyTimeLast14,
  heatmap30,
  sessionsByLocalDate,
} from "@/features/statistics/server/computeAggregates";
import { masteryFromUqp } from "@/features/statistics/server/masteryFromUqp";
import {
  isReadinessCacheStale,
  readinessFromProfile,
  refreshReadinessPercentileCache,
} from "@/features/statistics/server/refreshReadinessPercentileCache";
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
    .select(
      "xp, current_streak, readiness_percentile, readiness_cohort_size, readiness_user_attempts, readiness_computed_at",
    )
    .eq("id", userId)
    .maybeSingle();

  const recentSessionsQ = supabase
    .from("study_sessions")
    .select(
      "id, mode, completed_at, accuracy, total_questions, duration_seconds, subjects ( name )",
    )
    .eq("user_id", userId)
    .eq("is_completed", true)
    .order("completed_at", { ascending: false })
    .limit(20);

  const [sessionsRes, heatSessionsRes, uqpRes, profileRes, recentSessionsRes] =
    await Promise.all([sessQ, heatQ, uqpQ, profileQ, recentSessionsQ]);

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

  let readinessPeer = readinessFromProfile(profile);
  if (
    !readinessPeer ||
    isReadinessCacheStale(profile?.readiness_computed_at)
  ) {
    readinessPeer = await refreshReadinessPercentileCache(supabase, userId);
  }

  const { subjectMastery, weakTopics, predictedReadiness } =
    await masteryFromUqp(supabase, uqp);

  const recentSessions = (recentSessionsRes.data ?? []).map(
    (row: Record<string, unknown>) => {
      const sub = row.subjects as { name: string } | { name: string }[] | null;
      const name = Array.isArray(sub) ? sub[0]?.name : sub?.name;
      return {
        id: row.id as string,
        subjectName: (name as string) ?? "Przedmiot",
        mode: (row.mode as string) ?? "inteligentna",
        completedAt: row.completed_at as string,
        accuracy: (row.accuracy as number | null) ?? null,
        totalQuestions: (row.total_questions as number | null) ?? 0,
        durationSeconds: (row.duration_seconds as number | null) ?? null,
      };
    },
  );

  return {
    range,
    accuracyTrend,
    studyTimePerDay,
    subjectMastery,
    weakTopics,
    predictedReadiness,
    readinessMargin: 0.05,
    peerPercentile: readinessPeer.peerPercentile,
    peerCohortSize: readinessPeer.peerCohortSize,
    peerUserAttempts: readinessPeer.peerUserAttempts,
    totalQuestionsAnswered,
    totalStudyMinutes,
    currentStreak: profile?.current_streak ?? 0,
    xp: profile?.xp ?? 0,
    heatmap,
    recentSessions,
  };
}
