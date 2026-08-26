export const MEMORY_V2_EXPERIMENT_KEY = "memory-v2-rollout";
export const ADAPTIVE_FEEDBACK_EXPERIMENT_KEY = "adaptive-feedback-v1";
export const DAILY_PLAN_EXPERIMENT_KEY = "daily-plan-v1";

export type MemoryEngineVariant = "shadow" | "treatment";
export type LearningExperimentVariant = "control" | "treatment";

/** Stabilny FNV-1a; ten sam użytkownik pozostaje w tym samym kubełku 0–9999. */
export function experimentBucket(
  userId: string,
  experimentKey: string,
): number {
  let hash = 0x811c9dc5;
  const input = `${experimentKey}:${userId}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % 10_000;
}

export function variantForRollout(
  bucket: number,
  rolloutPercent: number,
): MemoryEngineVariant {
  const threshold = Math.min(100, Math.max(0, rolloutPercent)) * 100;
  return bucket < threshold ? "treatment" : "shadow";
}

export function learningVariantForRollout(
  bucket: number,
  rolloutPercent: number,
): LearningExperimentVariant {
  return variantForRollout(bucket, rolloutPercent) === "treatment"
    ? "treatment"
    : "control";
}
