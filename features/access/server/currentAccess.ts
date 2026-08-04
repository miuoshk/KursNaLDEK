import "server-only";

import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { hasActiveEntitlementForSelection } from "@/features/access/server/entitlements";
import {
  normalizeProduct,
  normalizeTrack,
  normalizeYear,
  isClinicalProduct,
  type StudyProduct,
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

  if (product === "ldew" || product === "ldek") {
    return { track, year: 1, hasAccess: true };
  }

  const hasAccess = await hasActiveEntitlementForSelection(userId, track, year);

  return {
    track,
    year,
    hasAccess,
  };
}
