import "server-only";

import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { hasActiveEntitlementForSelection } from "@/features/access/server/entitlements";
import { normalizeTrack, normalizeYear, type StudyTrack, type StudyYear } from "@/features/access/lib/studyAccess";

export type CurrentSelectionAccess = {
  track: StudyTrack;
  year: StudyYear;
  hasAccess: boolean;
};

export async function loadCurrentSelectionAccess(userId: string): Promise<CurrentSelectionAccess> {
  const profile = await getProfileByUserId(userId);
  const track = normalizeTrack(profile?.current_track);
  const year = normalizeYear(profile?.current_year);
  const hasAccess = await hasActiveEntitlementForSelection(userId, track, year);

  return {
    track,
    year,
    hasAccess,
  };
}
