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
import { formatOfferAmount, formatPricePerDay } from "@/features/access/lib/formatOfferPrice";
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
  layout: "years" | "durations";
  cards: GateCard[];
};

type SummaryKey = GateOffer["includesKey"];

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
  const quotes = await loadOfferQuotes(offers);

  const summaryFor = (key: SummaryKey): string => t(`summaries.${key}` as Parameters<typeof t>[0]);

  if (usesDurationGate(product)) {
    const durationProduct = product === "ldek" ? "ldek" : "ldew";
    const cards = mapDurationGateCards({
      offers: getDurationOffers(durationProduct),
      entitlements: args.entitlements,
      product,
      kierunek: durationProduct === "ldek" ? t("gateKierunekLdek") : t("gateKierunekLdew"),
      durationLabel: (days) => t("durationTitle", { days }),
      summary: summaryFor,
      featuredLabel: t("featuredRecommended"),
      priceNoteDuration: (days) => t("priceNoteDuration", { days }),
      amountFor: (offer) => quotes.get(offer.id),
    }).map(attachStripePriceId);

    return {
      eyebrow: durationProduct === "ldek" ? t("eyebrowLdek") : t("eyebrowLdew"),
      title: t("chooseDuration"),
      layout: "durations",
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
    summary: summaryFor,
    featuredLabel: t("featuredYourYear"),
    priceNotePaid: t("priceNoteKnnp"),
    priceNoteTrial: t("priceNoteTrial"),
    trialAmount: t("trialAmount"),
    amountFor: (offer) => quotes.get(offer.id),
  }).map(attachStripePriceId);

  return {
    eyebrow: t("eyebrowLdek"),
    title: t("chooseTrackYear"),
    layout: "years",
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

async function loadOfferQuotes(
  offers: GateOffer[],
): Promise<Map<string, { amount: string; perDay?: string }>> {
  const quotes = new Map<string, { amount: string; perDay?: string }>();
  if (!process.env.STRIPE_SECRET_KEY) {
    return quotes;
  }

  let stripe: ReturnType<typeof getStripeServerClient>;
  try {
    stripe = getStripeServerClient();
  } catch {
    return quotes;
  }

  await Promise.all(
    offers.map(async (offer) => {
      const priceId = peekStripePriceIdForOffer(offer);
      if (!priceId) return;
      try {
        const price = await stripe.prices.retrieve(priceId);
        if (price.unit_amount == null) return;
        const currency = price.currency ?? "pln";
        quotes.set(offer.id, {
          amount: formatOfferAmount(price.unit_amount, currency),
          perDay:
            offer.kind === "duration"
              ? formatPricePerDay(price.unit_amount, offer.accessDays, currency)
              : undefined,
        });
      } catch (error) {
        console.error("[loadPricingGate] stripe price retrieve failed", offer.id, error);
      }
    }),
  );

  return quotes;
}
