import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  experimentBucket,
  learningVariantForRollout,
  type LearningExperimentVariant,
} from "@/features/session/lib/experiments/memoryV2Experiment";

export type ResolvedLearningExperiment = {
  experimentKey: string;
  variant: LearningExperimentVariant;
  bucket: number;
  rolloutPercent: number;
};

export async function resolveLearningExperiment(
  supabase: SupabaseClient,
  userId: string,
  experimentKey: string,
  options?: { requiredSchedulerVersion?: string },
): Promise<ResolvedLearningExperiment> {
  const bucket = experimentBucket(userId, experimentKey);
  const fallback: ResolvedLearningExperiment = {
    experimentKey,
    variant: "control",
    bucket,
    rolloutPercent: 0,
  };
  const { data: config, error } = await supabase
    .from("learning_experiment_configs")
    .select("rollout_percent, active, scheduler_version")
    .eq("experiment_key", experimentKey)
    .maybeSingle();
  if (
    error ||
    !config?.active ||
    (options?.requiredSchedulerVersion &&
      config.scheduler_version !== options.requiredSchedulerVersion)
  ) {
    return fallback;
  }

  const rolloutPercent = Math.min(
    100,
    Math.max(0, Number(config.rollout_percent ?? 0)),
  );
  const variant = learningVariantForRollout(bucket, rolloutPercent);
  const { error: assignmentError } = await createAdminClient()
    .from("learning_experiment_assignments")
    .upsert(
      {
        user_id: userId,
        experiment_key: experimentKey,
        bucket,
        variant,
        rollout_percent: rolloutPercent,
        assigned_at: new Date().toISOString(),
      },
      { onConflict: "user_id,experiment_key" },
    );
  if (assignmentError) {
    console.error(
      "[resolveLearningExperiment] assignment",
      assignmentError.message,
    );
  }

  return { experimentKey, variant, bucket, rolloutPercent };
}
