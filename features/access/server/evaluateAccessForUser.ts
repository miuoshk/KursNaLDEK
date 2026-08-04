import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasAnyValidEntitlement,
  hasValidEntitlementForSelection,
  type EntitlementRowForAccess,
} from "@/features/access/lib/evaluateEntitlementAccess";
import { isClinicalProduct, normalizeProduct, normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";

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
      .select("access_revoked_at, current_track, current_year, current_product")
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
  const product = normalizeProduct(profileResult.data?.current_product as string | null | undefined);
  const rows = (entitlementsResult.data ?? []) as EntitlementRowForAccess[];

  if (isClinicalProduct(product)) {
    return {
      revoked: Boolean(profileResult.data?.access_revoked_at),
      hasAny: true,
      hasCurrent: true,
      track,
      year,
    };
  }

  return {
    revoked: Boolean(profileResult.data?.access_revoked_at),
    hasAny: hasAnyValidEntitlement(rows),
    hasCurrent: hasValidEntitlementForSelection(rows, track, year),
    track,
    year,
  };
}
