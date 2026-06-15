import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReadinessPercentileCache = {
  peerPercentile: number | null;
  peerCohortSize: number;
  peerUserAttempts: number;
};

type PercentileRow = {
  cohort_size: number | null;
  user_attempts: number | null;
  percentile: number | string | null;
};

function parsePercentileRow(row: PercentileRow | undefined): ReadinessPercentileCache {
  const raw = row?.percentile ?? null;
  const peerPercentile =
    raw == null
      ? null
      : typeof raw === "string"
        ? Number(raw)
        : raw;

  return {
    peerPercentile: Number.isFinite(peerPercentile) ? peerPercentile : null,
    peerCohortSize: row?.cohort_size ?? 0,
    peerUserAttempts: row?.user_attempts ?? 0,
  };
}

export async function computeReadinessPercentile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReadinessPercentileCache> {
  const { data, error } = await supabase.rpc("get_readiness_percentile", {
    p_user_id: userId,
  });

  if (error) {
    console.error("[computeReadinessPercentile]", error.message);
    return {
      peerPercentile: null,
      peerCohortSize: 0,
      peerUserAttempts: 0,
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as PercentileRow | undefined)
    : undefined;
  return parsePercentileRow(row);
}

/** Wylicza percentyl kohorty i zapisuje w profilu (cache na /statystyki). */
export async function refreshReadinessPercentileCache(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReadinessPercentileCache> {
  const parsed = await computeReadinessPercentile(supabase, userId);

  const admin = createAdminClient();
  const { error: updateErr } = await admin
    .from("profiles")
    .update({
      readiness_percentile: parsed.peerPercentile,
      readiness_cohort_size: parsed.peerCohortSize,
      readiness_user_attempts: parsed.peerUserAttempts,
      readiness_computed_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateErr) {
    console.error("[refreshReadinessPercentileCache] profile update", updateErr.message);
  }

  return parsed;
}

export function readinessFromProfile(row: {
  readiness_percentile?: number | string | null;
  readiness_cohort_size?: number | null;
  readiness_user_attempts?: number | null;
  readiness_computed_at?: string | null;
} | null): ReadinessPercentileCache | null {
  if (!row?.readiness_computed_at) {
    return null;
  }

  const raw = row.readiness_percentile ?? null;
  const peerPercentile =
    raw == null
      ? null
      : typeof raw === "string"
        ? Number(raw)
        : raw;

  return {
    peerPercentile: Number.isFinite(peerPercentile) ? peerPercentile : null,
    peerCohortSize: row.readiness_cohort_size ?? 0,
    peerUserAttempts: row.readiness_user_attempts ?? 0,
  };
}

export const READINESS_CACHE_TTL_MS = 24 * 3600 * 1000;

export function isReadinessCacheStale(computedAt: string | null | undefined): boolean {
  if (!computedAt) return true;
  return Date.now() - new Date(computedAt).getTime() > READINESS_CACHE_TTL_MS;
}
