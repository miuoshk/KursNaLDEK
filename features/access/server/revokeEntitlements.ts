import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getEntitlementExpiresAt } from "@/features/access/lib/entitlementExpiry";
import {
  filterValidEntitlements,
  type EntitlementRowForAccess,
} from "@/features/access/lib/evaluateEntitlementAccess";
import type { AccessType, StudyTrack, StudyYear } from "@/features/access/lib/studyAccess";

export async function revokeAllEntitlementsForUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_year_entitlements")
    .update({ active: false })
    .eq("user_id", userId)
    .eq("active", true);

  if (error) {
    throw new Error(error.message);
  }
}

export async function revokeEntitlementForSelection(args: {
  userId: string;
  track: StudyTrack;
  year: StudyYear;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_year_entitlements")
    .update({ active: false })
    .eq("user_id", args.userId)
    .eq("track", args.track)
    .eq("year", args.year)
    .eq("active", true);

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncProfileSubscriptionStatus(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data, error: readError } = await admin
    .from("user_year_entitlements")
    .select("access_type, granted_at, active")
    .eq("user_id", userId)
    .eq("active", true);

  if (readError) {
    throw new Error(readError.message);
  }

  const paidEntitlements = filterValidEntitlements(
    (data ?? []) as EntitlementRowForAccess[],
  ).filter((entry) => entry.access_type === "paid");

  const latestExpiry = paidEntitlements
    .map((entry) => getEntitlementExpiresAt(entry.granted_at, entry.access_type as AccessType))
    .filter((date): date is Date => date !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const { error } = await admin
    .from("profiles")
    .update({
      subscription_status: paidEntitlements.length > 0 ? "active" : "inactive",
      subscription_ends_at: latestExpiry?.toISOString() ?? null,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
