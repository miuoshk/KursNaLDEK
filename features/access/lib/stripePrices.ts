import { optionKey, type StudyTrack, type StudyYear } from "@/features/access/lib/studyAccess";
import type { GateOffer } from "@/features/access/lib/gateCatalog";

const YEAR_PRICE_IDS: Record<string, string | undefined> = {
  [optionKey("stomatologia", 1)]: process.env.STRIPE_PRICE_STOMATOLOGIA_1,
  [optionKey("stomatologia", 3)]: process.env.STRIPE_PRICE_STOMATOLOGIA_3,
  [optionKey("lekarski", 1)]: process.env.STRIPE_PRICE_LEKARSKI_1,
  [optionKey("lekarski", 2)]: process.env.STRIPE_PRICE_LEKARSKI_2,
  [optionKey("lekarski", 3)]: process.env.STRIPE_PRICE_LEKARSKI_3,
};

const DURATION_PRICE_IDS: Record<string, string | undefined> = {
  "ldew-30": process.env.STRIPE_PRICE_LDEW_30,
  "ldew-180": process.env.STRIPE_PRICE_LDEW_180,
  "ldew-365": process.env.STRIPE_PRICE_LDEW_365,
  "ldek-30": process.env.STRIPE_PRICE_LDEK_30,
  "ldek-180": process.env.STRIPE_PRICE_LDEK_180,
  "ldek-365": process.env.STRIPE_PRICE_LDEK_365,
};

export function getStripePriceId(track: StudyTrack, year: StudyYear): string {
  const key = optionKey(track, year);
  const priceId = YEAR_PRICE_IDS[key];
  if (!priceId) {
    throw new Error(`Brak price ID dla opcji ${track} rok ${year}.`);
  }
  return priceId;
}

export function getStripePriceIdForOffer(offer: GateOffer): string {
  if (offer.kind === "duration") {
    const priceId = DURATION_PRICE_IDS[offer.offerKey];
    if (!priceId) {
      throw new Error(`Brak price ID dla oferty ${offer.offerKey}.`);
    }
    return priceId;
  }
  return getStripePriceId(offer.track, offer.year);
}

export function peekStripePriceIdForOffer(offer: GateOffer): string | undefined {
  if (offer.kind === "duration") {
    return DURATION_PRICE_IDS[offer.offerKey];
  }
  return YEAR_PRICE_IDS[optionKey(offer.track, offer.year)];
}
