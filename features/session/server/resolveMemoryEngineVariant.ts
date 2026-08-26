import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MEMORY_V2_EXPERIMENT_KEY,
  type MemoryEngineVariant,
} from "@/features/session/lib/experiments/memoryV2Experiment";
import { resolveLearningExperiment } from "@/features/session/server/resolveLearningExperiment";
import { MEMORY_SCHEDULER_VERSION } from "@/features/session/lib/memory/scheduler";

export type ResolvedMemoryExperiment = {
  engineVariant: MemoryEngineVariant;
  experimentKey: string;
  bucket: number;
  rolloutPercent: number;
};

export async function resolveMemoryEngineVariant(
  supabase: SupabaseClient,
  userId: string,
): Promise<ResolvedMemoryExperiment> {
  const resolved = await resolveLearningExperiment(
    supabase,
    userId,
    MEMORY_V2_EXPERIMENT_KEY,
    { requiredSchedulerVersion: MEMORY_SCHEDULER_VERSION },
  );
  let engineVariant: MemoryEngineVariant =
    resolved.variant === "treatment" ? "treatment" : "shadow";
  if (engineVariant === "treatment") {
    const { data: parameterSet, error } = await supabase
      .from("fsrs_parameter_sets")
      .select("id, weights")
      .eq("scheduler_version", MEMORY_SCHEDULER_VERSION)
      .eq("scope", "global")
      .eq("active", true)
      .maybeSingle();
    const weights = parameterSet?.weights;
    if (
      error ||
      !parameterSet ||
      !Array.isArray(weights) ||
      weights.length !== 21 ||
      weights.some((value) => !Number.isFinite(Number(value)))
    ) {
      console.error(
        "[resolveMemoryEngineVariant] treatment fallback",
        error?.message ?? "missing global parameter set",
      );
      engineVariant = "shadow";
    }
  }

  return {
    engineVariant,
    experimentKey: MEMORY_V2_EXPERIMENT_KEY,
    bucket: resolved.bucket,
    rolloutPercent: resolved.rolloutPercent,
  };
}
