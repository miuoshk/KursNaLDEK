import type { AccessType, StudyTrack, StudyYear } from "@/features/access/lib/studyAccess";
import { normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";
import { isEntitlementCurrentlyValid } from "@/features/access/lib/entitlementExpiry";

export type EntitlementRowForAccess = {
  track: string;
  year: number;
  access_type: AccessType;
  granted_at: string;
  active: boolean;
};

export function filterValidEntitlements(rows: EntitlementRowForAccess[]): EntitlementRowForAccess[] {
  return rows.filter((row) => row.active && isEntitlementCurrentlyValid(row));
}

export function hasValidEntitlementForSelection(
  rows: EntitlementRowForAccess[],
  track: StudyTrack,
  year: StudyYear,
): boolean {
  return filterValidEntitlements(rows).some(
    (row) => normalizeTrack(row.track) === track && normalizeYear(row.year) === year,
  );
}

export function hasAnyValidEntitlement(rows: EntitlementRowForAccess[]): boolean {
  return filterValidEntitlements(rows).length > 0;
}
