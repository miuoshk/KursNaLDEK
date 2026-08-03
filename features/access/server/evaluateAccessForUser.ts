import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasAnyValidEntitlement,
  hasValidEntitlementForSelection,
  type EntitlementRowForAccess,
} from "@/features/access/lib/evaluateEntitlementAccess";
import { normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";

export type UserAccessEvaluation = {
  revoked: boolean;
  hasAny: boolean;
  hasCurrent: boolean;
  track: ReturnType<typeof normalizeTrack>;
  year: ReturnType<typeof normalizeYear>;
};

export async function evaluateAccessForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserAccessEvaluation> {
  const [profileResult, entitlementsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("access_revoked_at, current_track, current_year")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_year_entitlements")
      .select("track, year, access_type, granted_at, active")
      .eq("user_id", userId)
      .eq("active", true),
  ]);

  const track = normalizeTrack(profileResult.data?.current_track);
  const year = normalizeYear(profileResult.data?.current_year);
  const rows = (entitlementsResult.data ?? []) as EntitlementRowForAccess[];

  return {
    revoked: Boolean(profileResult.data?.access_revoked_at),
    hasAny: hasAnyValidEntitlement(rows),
    hasCurrent: hasValidEntitlementForSelection(rows, track, year),
    track,
    year,
  };
}
