import type { AccessType } from "@/features/access/lib/studyAccess";
import { CONSUMER_CONSENT_ACCESS_DAYS } from "@/features/checkout/constants/consentText";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type EntitlementTiming = {
  access_type: AccessType;
  granted_at: string;
  active: boolean;
};

export function getPaidAccessDurationMs(): number {
  return CONSUMER_CONSENT_ACCESS_DAYS * MS_PER_DAY;
}

export function getEntitlementExpiresAt(
  grantedAt: string | Date,
  accessType: AccessType,
): Date | null {
  if (accessType !== "paid") {
    return null;
  }
  const start = grantedAt instanceof Date ? grantedAt : new Date(grantedAt);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  return new Date(start.getTime() + getPaidAccessDurationMs());
}

export function isEntitlementCurrentlyValid(
  row: EntitlementTiming,
  now: Date = new Date(),
): boolean {
  if (!row.active) {
    return false;
  }
  const expiresAt = getEntitlementExpiresAt(row.granted_at, row.access_type);
  if (!expiresAt) {
    return true;
  }
  return expiresAt.getTime() > now.getTime();
}
