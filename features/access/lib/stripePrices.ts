import { optionKey, type StudyTrack, type StudyYear } from "@/features/access/lib/studyAccess";

const PRICE_IDS: Record<string, string | undefined> = {
  [optionKey("stomatologia", 1)]: process.env.STRIPE_PRICE_STOMATOLOGIA_1,
  [optionKey("stomatologia", 3)]: process.env.STRIPE_PRICE_STOMATOLOGIA_3,
  [optionKey("lekarski", 1)]: process.env.STRIPE_PRICE_LEKARSKI_1,
  [optionKey("lekarski", 2)]: process.env.STRIPE_PRICE_LEKARSKI_2,
  [optionKey("lekarski", 3)]: process.env.STRIPE_PRICE_LEKARSKI_3,
};

export function getStripePriceId(track: StudyTrack, year: StudyYear): string {
  const key = optionKey(track, year);
  const priceId = PRICE_IDS[key];
  if (!priceId) {
    throw new Error(`Brak price ID dla opcji ${track} rok ${year}.`);
  }
  return priceId;
}
