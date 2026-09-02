import type { AccessType } from "@/features/access/lib/studyAccess";
import { CONSUMER_CONSENT_ACCESS_DAYS } from "@/features/checkout/constants/consentText";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type EntitlementTiming = {
  access_type: AccessType;
  granted_at: string;
  active: boolean;
  access_days?: number | null;
};

export function resolvePaidAccessDays(accessDays?: number | null): number {
  if (typeof accessDays === "number" && Number.isFinite(accessDays) && accessDays > 0) {
    return accessDays;
  }
  return CONSUMER_CONSENT_ACCESS_DAYS;
}

export function getPaidAccessDurationMs(accessDays?: number | null): number {
  return resolvePaidAccessDays(accessDays) * MS_PER_DAY;
}

export function getEntitlementExpiresAt(
  grantedAt: string | Date,
  accessType: AccessType,
  accessDays?: number | null,
): Date | null {
  if (accessType !== "paid") {
    return null;
  }
  const start = grantedAt instanceof Date ? grantedAt : new Date(grantedAt);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  return new Date(start.getTime() + getPaidAccessDurationMs(accessDays));
}

export function isEntitlementCurrentlyValid(
  row: EntitlementTiming,
  now: Date = new Date(),
): boolean {
  if (!row.active) {
    return false;
  }
  const expiresAt = getEntitlementExpiresAt(row.granted_at, row.access_type, row.access_days);
  if (!expiresAt) {
    return true;
  }
  return expiresAt.getTime() > now.getTime();
}

/** Dni do końca płatnego okna. `null` dla roku testowego (nie wygasa). */
export function getRemainingAccessDays(
  row: Pick<EntitlementTiming, "access_type" | "granted_at" | "access_days">,
  now: Date = new Date(),
): number | null {
  const expiresAt = getEntitlementExpiresAt(row.granted_at, row.access_type, row.access_days);
  if (!expiresAt) return null;
  const ms = expiresAt.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / MS_PER_DAY);
}
