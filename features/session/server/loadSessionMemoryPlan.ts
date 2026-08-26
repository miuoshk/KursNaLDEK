import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { estimateQuestionSeconds } from "@/features/session/lib/dailyPlan";
import { deriveRetentionPolicy } from "@/features/session/lib/memory/retentionPolicy";
import { MEMORY_SCHEDULER_VERSION } from "@/features/session/lib/memory/scheduler";
import { loadMemorySchedulerConfig } from "@/features/session/server/loadMemorySchedulerConfig";

type ProfileMemoryPreferences = {
  daily_study_minutes?: number | null;
  exam_date?: string | null;
  average_question_seconds?: number | null;
};

export async function loadSessionMemoryPlan(
  supabase: SupabaseClient,
  userId: string,
  profile: ProfileMemoryPreferences | null,
  context: {
    product?: string | null;
    track?: string | null;
    engineVariant?: "shadow" | "treatment";
  },
) {
  const dueTable =
    context.engineVariant === "treatment"
      ? "user_question_memory_v2"
      : "user_question_progress";
  let dueQuery = supabase
    .from(dueTable)
    .select("question_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("state", "new")
    .lte("next_review", new Date().toISOString());
  if (context.engineVariant === "treatment") {
    dueQuery = dueQuery.eq("scheduler_version", MEMORY_SCHEDULER_VERSION);
  }
  const [parameters, dueResult] = await Promise.all([
    loadMemorySchedulerConfig(supabase, userId, context),
    dueQuery,
  ]);

  const answerSeconds = estimateQuestionSeconds(
    profile?.average_question_seconds,
  );
  const dailyMinutes = Number(profile?.daily_study_minutes ?? 25);
  const retention = deriveRetentionPolicy({
    baseRetention: parameters.requestRetention,
    dailyMinutes,
    dueCount: dueResult.count ?? 0,
    averageQuestionSeconds: answerSeconds,
    examDate: profile?.exam_date ?? null,
  });

  return {
    parameters,
    retention,
    daily: {
      budgetMinutes: Math.min(240, Math.max(5, Math.round(dailyMinutes))),
      averageQuestionSeconds: answerSeconds,
      dueCount: dueResult.count ?? 0,
    },
    settings: {
      requestRetention: retention.requestRetention,
      maximumInterval: retention.maximumInterval,
      weights: parameters.weights,
    },
  };
}
