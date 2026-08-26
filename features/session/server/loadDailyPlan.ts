import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildDailyPlan,
  estimateQuestionSeconds,
  type DailyStudyPlan,
} from "@/features/session/lib/dailyPlan";
import { deriveRetentionPolicy } from "@/features/session/lib/memory/retentionPolicy";
import { DAILY_PLAN_EXPERIMENT_KEY } from "@/features/session/lib/experiments/memoryV2Experiment";
import { resolveLearningExperiment } from "@/features/session/server/resolveLearningExperiment";

type DailyPlanProfile = {
  daily_study_minutes?: number | null;
  exam_date?: string | null;
  average_question_seconds?: number | null;
};

type LoadDailyPlanOptions = {
  dueCount: number;
  questionsToday: number;
  subjectId?: string;
  maxQuestions?: number;
};

export async function loadDailyPlan(
  supabase: SupabaseClient,
  userId: string,
  profile: DailyPlanProfile | null,
  options: LoadDailyPlanOptions,
): Promise<DailyStudyPlan> {
  const leechQuery = options.subjectId
    ? supabase
        .from("user_question_progress")
        .select("id, questions!inner(topics!inner(subject_id))", {
          count: "exact",
          head: true,
        })
        .eq("user_id", userId)
        .eq("is_leech", true)
        .eq("questions.topics.subject_id", options.subjectId)
    : supabase
        .from("user_question_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_leech", true);
  const savedQuery = options.subjectId
    ? supabase
        .from("saved_questions")
        .select("question_id, questions!inner(topics!inner(subject_id))", {
          count: "exact",
          head: true,
        })
        .eq("user_id", userId)
        .eq("questions.topics.subject_id", options.subjectId)
    : supabase
        .from("saved_questions")
        .select("question_id", { count: "exact", head: true })
        .eq("user_id", userId);
  const [leechResult, savedResult, experiment] = await Promise.all([
    leechQuery,
    savedQuery,
    resolveLearningExperiment(supabase, userId, DAILY_PLAN_EXPERIMENT_KEY),
  ]);

  const dueCount = options.dueCount;

  const dailyMinutes = Number(profile?.daily_study_minutes ?? 25);
  const averageQuestionSeconds = estimateQuestionSeconds(
    profile?.average_question_seconds,
  );
  const policy = deriveRetentionPolicy({
    dailyMinutes,
    dueCount,
    averageQuestionSeconds,
    examDate: profile?.exam_date ?? null,
  });

  return {
    ...buildDailyPlan({
      dailyMinutes,
      averageQuestionSeconds,
      questionsToday: options.questionsToday,
      dueBacklog: dueCount,
      remediationBacklog: leechResult.count ?? 0,
      savedConceptSignalCount: savedResult.count ?? 0,
      daysToExam: policy.daysToExam,
      maxQuestions: options.maxQuestions,
      subjectId: options.subjectId,
    }),
    experimentVariant: experiment.variant,
  };
}
