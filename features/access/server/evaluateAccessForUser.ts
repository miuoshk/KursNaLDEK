import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasAnyValidEntitlement,
  hasValidEntitlementForProduct,
  hasValidEntitlementForSelection,
  type EntitlementRowForAccess,
} from "@/features/access/lib/evaluateEntitlementAccess";
import { shouldBypassPurchaseGate } from "@/features/access/lib/purchaseGate";
import { usesDurationGate } from "@/features/access/lib/gateCatalog";
import { normalizeProduct, normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";

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
      .select("access_revoked_at, current_track, current_year, current_product, role")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_year_entitlements")
      .select("track, year, access_type, granted_at, active, product, offer_key, access_days")
      .eq("user_id", userId)
      .eq("active", true),
  ]);

  const track = normalizeTrack(profileResult.data?.current_track);
  const year = normalizeYear(profileResult.data?.current_year);
  const product = normalizeProduct(profileResult.data?.current_product as string | null | undefined);
  const rows = (entitlementsResult.data ?? []) as EntitlementRowForAccess[];
  const revoked = Boolean(profileResult.data?.access_revoked_at);

  if (shouldBypassPurchaseGate(product, profileResult.data?.role)) {
    return { revoked, hasAny: true, hasCurrent: true, track, year };
  }

  if (usesDurationGate(product)) {
    const has = hasValidEntitlementForProduct(rows, product);
    return { revoked, hasAny: has, hasCurrent: has, track, year };
  }

  return {
    revoked,
    hasAny: hasAnyValidEntitlement(rows.filter((row) => normalizeProduct(row.product) === "knnp")),
    hasCurrent: hasValidEntitlementForSelection(rows, track, year, "knnp"),
    track,
    year,
  };
}
