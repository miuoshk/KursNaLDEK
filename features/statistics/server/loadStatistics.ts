import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildAccuracyTrend,
  buildStudyTimeLast14,
  heatmap30,
  sessionsByLocalDate,
} from "@/features/statistics/server/computeAggregates";
import { masteryFromCache } from "@/features/statistics/server/masteryFromCache";
import {
  isReadinessCacheStale,
  readinessFromProfile,
  refreshReadinessPercentileCache,
} from "@/features/statistics/server/refreshReadinessPercentileCache";
import type { StatisticsPayload, TimeRangeKey } from "@/features/statistics/types";
import type { SourceAccuracyBreakdown } from "@/features/session/lib/sourceAccuracy";
import {
  addSourceSlices,
  emptySourceSlice,
} from "@/features/session/lib/sourceAccuracy";
import { FEATURES } from "@/lib/featureFlags";
import { hasCemExams, isSourceFilterLive } from "@/lib/products";
import { CEM_RESERVE_BUCKET_MIN } from "@/features/session/lib/antares/cemReserve";

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
    await masteryFromCache(supabase, userId);

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

  const sourceAccuracy = await loadSourceAccuracyBreakdown(
    supabase,
    userId,
    uqp,
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
    sourceAccuracy,
  };
}

async function loadSourceAccuracyBreakdown(
  supabase: SupabaseClient,
  userId: string,
  uqp: { question_id: string; times_answered: number | null }[],
): Promise<SourceAccuracyBreakdown | null> {
  if (!FEATURES.cemSource) return null;

  const { data: rows, error } = await supabase
    .from("topic_mastery_cache")
    .select(
      "ref_total, ref_seen, ref_correct, seen_questions, total_questions, correct_answers, topics!inner(is_inbox, subject_id, subjects!inner(product))",
    )
    .eq("user_id", userId)
    .eq("topics.is_inbox", false);

  if (error) {
    console.error("[loadStatistics] sourceAccuracy:", error.message);
    return null;
  }

  let product: string | null = null;
  let reference = emptySourceSlice();
  let own = emptySourceSlice();
  const liveSubjectIds = new Set<string>();

  for (const row of rows ?? []) {
    const topic = row.topics as
      | {
          is_inbox?: boolean;
          subject_id?: string;
          subjects?: { product?: string } | { product?: string }[];
        }
      | {
          is_inbox?: boolean;
          subject_id?: string;
          subjects?: { product?: string } | { product?: string }[];
        }[]
      | null;
    const topicRow = Array.isArray(topic) ? topic[0] : topic;
    const sub = topicRow?.subjects;
    const rowProduct = Array.isArray(sub) ? sub[0]?.product : sub?.product;
    if (!isSourceFilterLive(rowProduct)) continue;
    if (!product && rowProduct) product = rowProduct;
    if (topicRow?.subject_id) liveSubjectIds.add(topicRow.subject_id);

    const refTotal = Number(row.ref_total ?? 0);
    const refSeen = Number(row.ref_seen ?? 0);
    const refCorrect = Number(row.ref_correct ?? 0);
    const total = Number(row.total_questions ?? 0);
    const seen = Number(row.seen_questions ?? 0);
    const correct = Number(row.correct_answers ?? 0);
    reference = addSourceSlices(reference, {
      total: refTotal,
      seen: refSeen,
      correct: refCorrect,
    });
    own = addSourceSlices(own, {
      total: Math.max(0, total - refTotal),
      seen: Math.max(0, seen - refSeen),
      correct: Math.max(0, correct - refCorrect),
    });
  }

  if (!product) return null;

  let protectedCount = 0;
  if (hasCemExams(product) && liveSubjectIds.size > 0) {
    const seenIds = new Set(
      uqp
        .filter((r) => Number(r.times_answered ?? 0) > 0)
        .map((r) => r.question_id),
    );
    const { data: reserved } = await supabase
      .from("questions")
      .select("id, topics!inner(subject_id, is_inbox)")
      .eq("source", "cem")
      .gte("reserve_bucket", CEM_RESERVE_BUCKET_MIN)
      .eq("is_active", true)
      .eq("topics.is_inbox", false)
      .in("topics.subject_id", [...liveSubjectIds]);
    for (const q of reserved ?? []) {
      if (!seenIds.has(q.id as string)) protectedCount += 1;
    }
  }

  return { product, reference, own, protectedCount };
}
