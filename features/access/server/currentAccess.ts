import "server-only";

import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import {
  hasActiveEntitlementForProduct,
  hasActiveEntitlementForSelection,
} from "@/features/access/server/entitlements";
import { shouldBypassPurchaseGate } from "@/features/access/lib/purchaseGate";
import { usesDurationGate } from "@/features/access/lib/gateCatalog";
import {
  normalizeProduct,
  normalizeTrack,
  normalizeYear,
  type StudyTrack,
  type StudyYear,
} from "@/features/access/lib/studyAccess";

export type CurrentSelectionAccess = {
  track: StudyTrack;
  year: StudyYear;
  hasAccess: boolean;
};

export async function loadCurrentSelectionAccess(userId: string): Promise<CurrentSelectionAccess> {
  const profile = await getProfileByUserId(userId);
  const track = normalizeTrack(profile?.current_track);
  const year = normalizeYear(profile?.current_year);
  const product = normalizeProduct(profile?.current_product);

  if (shouldBypassPurchaseGate(product, profile?.role)) {
    return { track, year: usesDurationGate(product) ? 1 : year, hasAccess: true };
  }

  if (usesDurationGate(product)) {
    const hasAccess = await hasActiveEntitlementForProduct(userId, product);
    return { track, year: 1, hasAccess };
  }

  const hasAccess = await hasActiveEntitlementForSelection(userId, track, year, "knnp");

  return {
    track,
    year,
    hasAccess,
  };
}
