import { CONSUMER_CONSENT_ACCESS_DAYS } from "@/features/checkout/constants/consentText";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ExistingPaidGrant = {
  granted_at: string;
  access_days: number | null;
  offer_key: string | null;
};

export type ResolvedPaidGrant = {
  granted_at: Date;
  access_days: number;
  offer_key: string | null;
};

function expiryMs(grantedAt: Date, accessDays: number): number {
  return grantedAt.getTime() + accessDays * MS_PER_DAY;
}

/** Nie skracaj aktywnego pakietu, gdy ktoś dokupuje krótszy SKU. */
export function resolvePaidGrant(args: {
  now: Date;
  purchasedAccessDays: number;
  purchasedOfferKey: string | null;
  existing: ExistingPaidGrant | null;
}): ResolvedPaidGrant {
  const purchasedDays =
    args.purchasedAccessDays > 0 ? args.purchasedAccessDays : CONSUMER_CONSENT_ACCESS_DAYS;
  const purchasedExpiry = expiryMs(args.now, purchasedDays);

  if (!args.existing) {
    return {
      granted_at: args.now,
      access_days: purchasedDays,
      offer_key: args.purchasedOfferKey,
    };
  }

  const existingDays =
    args.existing.access_days && args.existing.access_days > 0
      ? args.existing.access_days
      : CONSUMER_CONSENT_ACCESS_DAYS;
  const existingStart = new Date(args.existing.granted_at);
  if (Number.isNaN(existingStart.getTime())) {
    return {
      granted_at: args.now,
      access_days: purchasedDays,
      offer_key: args.purchasedOfferKey,
    };
  }

  const existingExpiry = expiryMs(existingStart, existingDays);
  if (existingExpiry >= purchasedExpiry) {
    return {
      granted_at: existingStart,
      access_days: existingDays,
      offer_key: args.existing.offer_key ?? args.purchasedOfferKey,
    };
  }

  return {
    granted_at: args.now,
    access_days: purchasedDays,
    offer_key: args.purchasedOfferKey,
  };
}
