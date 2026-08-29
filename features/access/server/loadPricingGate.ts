"use server";

import { getTranslations } from "next-intl/server";
import type { Entitlement } from "@/features/access/server/entitlements";
import {
  getDurationOffers,
  KNNP_YEAR_OFFERS,
  resolveGateOfferById,
  usesDurationGate,
  type GateOffer,
} from "@/features/access/lib/gateCatalog";
import { mapDurationGateCards, mapYearGateCards } from "@/features/access/lib/mapGateCards";
import type { GateCard } from "@/features/access/lib/gateTypes";
import { peekStripePriceIdForOffer } from "@/features/access/lib/stripePrices";
import {
  formatTrackLabel,
  normalizeProduct,
  type StudyProduct,
  type StudyTrack,
  type StudyYear,
} from "@/features/access/lib/studyAccess";
import { getStripeServerClient } from "@/lib/stripe/server";

export type PricingGateModel = {
  eyebrow: string;
  title: string;
  cards: GateCard[];
};

type IncludesKey = GateOffer["includesKey"];

export async function loadPricingGateModel(args: {
  product: StudyProduct;
  selectedTrack: StudyTrack;
  selectedYear: StudyYear;
  entitlements: Entitlement[];
}): Promise<PricingGateModel> {
  const t = await getTranslations("access");
  const product = normalizeProduct(args.product);
  const offers = usesDurationGate(product)
    ? getDurationOffers(product === "ldek" ? "ldek" : "ldew")
    : KNNP_YEAR_OFFERS;
  const amounts = await loadOfferAmounts(offers);

  const includesFor = (key: IncludesKey): string[] => {
    const raw = t.raw(`includes.${key}`);
    return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
  };

  if (usesDurationGate(product)) {
    const durationProduct = product === "ldek" ? "ldek" : "ldew";
    const cards = mapDurationGateCards({
      offers: getDurationOffers(durationProduct),
      entitlements: args.entitlements,
      product,
      kierunek: durationProduct === "ldek" ? t("gateKierunekLdek") : t("gateKierunekLdew"),
      durationLabel: (days) => t("durationTitle", { days }),
      includes: includesFor,
      featuredLabel: t("featuredRecommended"),
      priceNoteDuration: (days) => t("priceNoteDuration", { days }),
      ownedNote: t("ownedNoteDuration"),
      amountFor: (offer) => amounts.get(offer.id),
    }).map(attachStripePriceId);

    return {
      eyebrow: durationProduct === "ldek" ? t("eyebrowLdek") : t("eyebrowLdew"),
      title: t("chooseDuration"),
      cards,
    };
  }

  const cards = mapYearGateCards({
    offers: KNNP_YEAR_OFFERS,
    entitlements: args.entitlements,
    selectedTrack: args.selectedTrack,
    selectedYear: args.selectedYear,
    kierunekLabel: (track) => formatTrackLabel(track, t),
    yearLabel: (year) => t("yearHeading", { year }),
    includes: includesFor,
    featuredLabel: t("featuredYourYear"),
    priceNotePaid: t("priceNoteKnnp"),
    priceNoteTrial: t("priceNoteTrial"),
    ownedNote: t("ownedNote"),
    trialAmount: t("trialAmount"),
    amountFor: (offer) => amounts.get(offer.id),
  }).map(attachStripePriceId);

  return {
    eyebrow: t("eyebrowLdek"),
    title: t("chooseTrackYear"),
    cards,
  };
}

function attachStripePriceId(card: GateCard): GateCard {
  if (card.state !== "locked") return card;
  const offerId = card.checkoutFields?.offerId;
  if (!offerId) return card;
  const offer = resolveGateOfferById(offerId);
  if (!offer) return card;
  return { ...card, stripePriceId: peekStripePriceIdForOffer(offer) };
}

async function loadOfferAmounts(offers: GateOffer[]): Promise<Map<string, string>> {
  const amounts = new Map<string, string>();
  if (!process.env.STRIPE_SECRET_KEY) {
    return amounts;
  }

  let stripe: ReturnType<typeof getStripeServerClient>;
  try {
    stripe = getStripeServerClient();
  } catch {
    return amounts;
  }

  await Promise.all(
    offers.map(async (offer) => {
      const priceId = peekStripePriceIdForOffer(offer);
      if (!priceId) return;
      try {
        const price = await stripe.prices.retrieve(priceId);
        if (price.unit_amount == null) return;
        amounts.set(
          offer.id,
          new Intl.NumberFormat("pl-PL", {
            style: "currency",
            currency: (price.currency ?? "pln").toUpperCase(),
            maximumFractionDigits: 0,
          }).format(price.unit_amount / 100),
        );
      } catch (error) {
        console.error("[loadPricingGate] stripe price retrieve failed", offer.id, error);
      }
    }),
  );

  return amounts;
}
