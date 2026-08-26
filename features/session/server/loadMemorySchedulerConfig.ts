import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_MEMORY_SETTINGS,
  MEMORY_SCHEDULER_VERSION,
  normalizeMemorySchedulerSettings,
  type MemorySchedulerSettings,
} from "@/features/session/lib/memory/scheduler";

export const MIN_PERSONAL_PARAMETER_ATTEMPTS = 300;
export const MIN_COHORT_PARAMETER_ATTEMPTS = 5_000;

type ParameterRow = {
  id: string;
  scheduler_version: string;
  scope: "global" | "cohort" | "user";
  product: string | null;
  track: string | null;
  user_id: string | null;
  weights: unknown;
  request_retention: number | null;
  maximum_interval: number | null;
  sample_size: number | null;
  log_loss: number | null;
  optimized_at: string;
};

export type LoadedMemorySchedulerConfig = MemorySchedulerSettings & {
  schedulerVersion: string;
  parameterSetId: string | null;
  parameterScope: ParameterRow["scope"] | "default";
  sampleSize: number;
  logLoss: number | null;
  optimizedAt: string | null;
};

function parseWeights(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const weights = value.map(Number);
  return weights.length === 21 && weights.every(Number.isFinite)
    ? weights
    : undefined;
}

function fromRow(row: ParameterRow): LoadedMemorySchedulerConfig {
  if (row.scheduler_version !== MEMORY_SCHEDULER_VERSION) {
    throw new Error("Niezgodna wersja zestawu parametrów FSRS.");
  }
  const weights = parseWeights(row.weights);
  if (!weights) {
    throw new Error("Nieprawidłowy zestaw wag FSRS.");
  }
  const settings = normalizeMemorySchedulerSettings({
    requestRetention:
      row.request_retention ?? DEFAULT_MEMORY_SETTINGS.requestRetention,
    maximumInterval:
      row.maximum_interval ?? DEFAULT_MEMORY_SETTINGS.maximumInterval,
    weights,
  });
  return {
    ...settings,
    schedulerVersion: MEMORY_SCHEDULER_VERSION,
    parameterSetId: row.id,
    parameterScope: row.scope,
    sampleSize: Number(row.sample_size ?? 0),
    logLoss: row.log_loss == null ? null : Number(row.log_loss),
    optimizedAt: row.optimized_at,
  };
}

function fromRowOrNull(
  row: ParameterRow | null | undefined,
): LoadedMemorySchedulerConfig | null {
  if (!row) return null;
  try {
    return fromRow(row);
  } catch (error) {
    console.error("[loadMemorySchedulerConfig]", error);
    return null;
  }
}

function defaultConfig(): LoadedMemorySchedulerConfig {
  return {
    ...DEFAULT_MEMORY_SETTINGS,
    schedulerVersion: MEMORY_SCHEDULER_VERSION,
    parameterSetId: null,
    parameterScope: "default",
    sampleSize: 0,
    logLoss: null,
    optimizedAt: null,
  };
}

export async function loadMemorySchedulerConfig(
  supabase: SupabaseClient,
  userId: string,
  context: { product?: string | null; track?: string | null },
): Promise<LoadedMemorySchedulerConfig> {
  const columns =
    "id, scheduler_version, scope, product, track, user_id, weights, request_retention, maximum_interval, sample_size, log_loss, optimized_at";

  const personalPromise = supabase
    .from("fsrs_parameter_sets")
    .select(columns)
    .eq("scheduler_version", MEMORY_SCHEDULER_VERSION)
    .eq("scope", "user")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  const cohortPromise = context.product
    ? supabase
        .from("fsrs_parameter_sets")
        .select(columns)
        .eq("scheduler_version", MEMORY_SCHEDULER_VERSION)
        .eq("scope", "cohort")
        .eq("product", context.product)
        .eq("active", true)
        .order("sample_size", { ascending: false })
        .limit(10)
    : Promise.resolve({ data: [], error: null });

  const globalPromise = supabase
    .from("fsrs_parameter_sets")
    .select(columns)
    .eq("scheduler_version", MEMORY_SCHEDULER_VERSION)
    .eq("scope", "global")
    .eq("active", true)
    .maybeSingle();

  const [personalResult, cohortResult, globalResult] = await Promise.all([
    personalPromise,
    cohortPromise,
    globalPromise,
  ]);

  const personal = personalResult.data as ParameterRow | null;
  if (
    personal &&
    Number(personal.sample_size ?? 0) >= MIN_PERSONAL_PARAMETER_ATTEMPTS
  ) {
    const parsed = fromRowOrNull(personal);
    if (parsed) return parsed;
  }

  const cohorts = (cohortResult.data ?? []) as ParameterRow[];
  const exactTrack = cohorts.find(
    (row) =>
      row.track === context.track &&
      Number(row.sample_size ?? 0) >= MIN_COHORT_PARAMETER_ATTEMPTS,
  );
  const broadCohort = cohorts.find(
    (row) =>
      row.track == null &&
      Number(row.sample_size ?? 0) >= MIN_COHORT_PARAMETER_ATTEMPTS,
  );
  const cohort = fromRowOrNull(exactTrack ?? broadCohort);
  if (cohort) return cohort;

  const global = globalResult.data as ParameterRow | null;
  return fromRowOrNull(global) ?? defaultConfig();
}

export async function loadMemoryParameterSetById(
  supabase: SupabaseClient,
  parameterSetId: string | null,
): Promise<LoadedMemorySchedulerConfig> {
  if (!parameterSetId) return defaultConfig();

  const { data, error } = await supabase
    .from("fsrs_parameter_sets")
    .select(
      "id, scheduler_version, scope, product, track, user_id, weights, request_retention, maximum_interval, sample_size, log_loss, optimized_at",
    )
    .eq("id", parameterSetId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Nie znaleziono zestawu parametrów FSRS.");
  return fromRow(data as ParameterRow);
}
