import type { StudyProduct, StudyTrack, StudyYear } from "@/features/access/lib/studyAccess";
import { STUDY_OPTIONS } from "@/features/access/lib/studyAccess";
import { CONSUMER_CONSENT_ACCESS_DAYS } from "@/features/checkout/constants/consentText";

export type YearGateOffer = {
  kind: "year";
  id: string;
  product: "knnp";
  track: StudyTrack;
  year: StudyYear;
  isFreeTest: boolean;
  accessDays: number;
  includesKey: "knnpStoma1" | "knnpStoma2" | "knnpStoma3" | "knnpLek1";
};

export type DurationGateOffer = {
  kind: "duration";
  id: string;
  product: Extract<StudyProduct, "ldew" | "ldek">;
  offerKey: string;
  accessDays: 30 | 180 | 365;
  recommended?: boolean;
  track: "stomatologia";
  year: 1;
  includesKey: "ldew30" | "ldew180" | "ldew365" | "ldek30" | "ldek180" | "ldek365";
};

export type GateOffer = YearGateOffer | DurationGateOffer;

const YEAR_INCLUDES: Record<string, YearGateOffer["includesKey"]> = {
  "stomatologia:1": "knnpStoma1",
  "stomatologia:2": "knnpStoma2",
  "stomatologia:3": "knnpStoma3",
  "lekarski:1": "knnpLek1",
};

export const KNNP_YEAR_OFFERS: YearGateOffer[] = STUDY_OPTIONS.map((option) => ({
  kind: "year",
  id: `knnp-${option.track}-${option.year}`,
  product: "knnp",
  track: option.track,
  year: option.year,
  isFreeTest: option.isFreeTest,
  accessDays: CONSUMER_CONSENT_ACCESS_DAYS,
  includesKey: YEAR_INCLUDES[`${option.track}:${option.year}`] ?? "knnpStoma1",
}));

function durationOffers(
  product: "ldew" | "ldek",
  prefix: "ldew" | "ldek",
): DurationGateOffer[] {
  return [
    {
      kind: "duration",
      id: `${prefix}-30`,
      product,
      offerKey: `${prefix}-30`,
      accessDays: 30,
      track: "stomatologia",
      year: 1,
      includesKey: prefix === "ldew" ? "ldew30" : "ldek30",
    },
    {
      kind: "duration",
      id: `${prefix}-180`,
      product,
      offerKey: `${prefix}-180`,
      accessDays: 180,
      track: "stomatologia",
      year: 1,
      includesKey: prefix === "ldew" ? "ldew180" : "ldek180",
    },
    {
      kind: "duration",
      id: `${prefix}-365`,
      product,
      offerKey: `${prefix}-365`,
      accessDays: 365,
      recommended: true,
      track: "stomatologia",
      year: 1,
      includesKey: prefix === "ldew" ? "ldew365" : "ldek365",
    },
  ];
}

/** Trzy SKU jednorazowe — ten sam kształt dla LDEW i (docelowo) LDEK klinicznego. */
export const LDEW_DURATION_OFFERS: DurationGateOffer[] = durationOffers("ldew", "ldew");
export const LDEK_DURATION_OFFERS: DurationGateOffer[] = durationOffers("ldek", "ldek");

export function getDurationOffers(product: "ldew" | "ldek"): DurationGateOffer[] {
  return product === "ldek" ? LDEK_DURATION_OFFERS : LDEW_DURATION_OFFERS;
}

export function getGateOffersForProduct(product: StudyProduct): GateOffer[] {
  if (product === "ldew") return LDEW_DURATION_OFFERS;
  if (product === "ldek") return LDEK_DURATION_OFFERS;
  return KNNP_YEAR_OFFERS;
}

export function resolveGateOfferById(offerId: string): GateOffer | null {
  const all: GateOffer[] = [
    ...KNNP_YEAR_OFFERS,
    ...LDEW_DURATION_OFFERS,
    ...LDEK_DURATION_OFFERS,
  ];
  return all.find((offer) => offer.id === offerId) ?? null;
}

export function usesDurationGate(product: StudyProduct): boolean {
  return product === "ldew" || product === "ldek";
}
