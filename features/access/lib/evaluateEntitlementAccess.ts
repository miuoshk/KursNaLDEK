import type { AccessType, StudyProduct, StudyTrack, StudyYear } from "@/features/access/lib/studyAccess";
import { normalizeProduct, normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";
import { isEntitlementCurrentlyValid } from "@/features/access/lib/entitlementExpiry";

export type EntitlementRowForAccess = {
  track: string;
  year: number;
  access_type: AccessType;
  granted_at: string;
  active: boolean;
  product?: string | null;
  offer_key?: string | null;
  access_days?: number | null;
};

export function filterValidEntitlements(rows: EntitlementRowForAccess[]): EntitlementRowForAccess[] {
  return rows.filter((row) => row.active && isEntitlementCurrentlyValid(row));
}

export function hasValidEntitlementForSelection(
  rows: EntitlementRowForAccess[],
  track: StudyTrack,
  year: StudyYear,
  product: StudyProduct = "knnp",
): boolean {
  return filterValidEntitlements(rows).some(
    (row) =>
      normalizeProduct(row.product) === product &&
      normalizeTrack(row.track) === track &&
      normalizeYear(row.year) === year,
  );
}

export function hasValidEntitlementForProduct(
  rows: EntitlementRowForAccess[],
  product: StudyProduct,
): boolean {
  return filterValidEntitlements(rows).some((row) => normalizeProduct(row.product) === product);
}

export function hasAnyValidEntitlement(rows: EntitlementRowForAccess[]): boolean {
  return filterValidEntitlements(rows).length > 0;
}

export function findValidEntitlementForProduct(
  rows: EntitlementRowForAccess[],
  product: StudyProduct,
): EntitlementRowForAccess | undefined {
  return filterValidEntitlements(rows).find((row) => normalizeProduct(row.product) === product);
}
