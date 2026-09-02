import type { GateOffer } from "@/features/access/lib/gateCatalog";
import type { GateCard, GateCardState } from "@/features/access/lib/gateTypes";
import { resolveGateCardState } from "@/features/access/lib/gateTypes";
import { getRemainingAccessDays } from "@/features/access/lib/entitlementExpiry";
import type { AccessType, StudyProduct, StudyTrack, StudyYear } from "@/features/access/lib/studyAccess";

export type GateEntitlementSlice = {
  product: StudyProduct;
  track: StudyTrack;
  year: StudyYear;
  offer_key: string | null;
  access_type?: AccessType;
  granted_at?: string;
  access_days?: number | null;
};

export type OfferPriceQuote = {
  amount?: string;
  perDay?: string;
};

export type GateAmountLookup = (offer: GateOffer) => OfferPriceQuote | undefined;

type MapYearCardsInput = {
  offers: Extract<GateOffer, { kind: "year" }>[];
  entitlements: GateEntitlementSlice[];
  selectedTrack: StudyTrack;
  selectedYear: StudyYear;
  kierunekLabel: (track: StudyTrack) => string;
  yearLabel: (year: StudyYear) => string;
  summary: (key: Extract<GateOffer, { kind: "year" }>["includesKey"]) => string;
  featuredLabel: string;
  priceNotePaid: string;
  priceNoteTrial: string;
  trialAmount: string;
  amountFor: GateAmountLookup;
  now?: Date;
};

type MapDurationCardsInput = {
  offers: Extract<GateOffer, { kind: "duration" }>[];
  entitlements: GateEntitlementSlice[];
  product: StudyProduct;
  kierunek: string;
  durationLabel: (days: number) => string;
  summary: (key: Extract<GateOffer, { kind: "duration" }>["includesKey"]) => string;
  featuredLabel: string;
  priceNoteDuration: (days: number) => string;
  amountFor: GateAmountLookup;
  now?: Date;
};

function checkoutFields(offer: GateOffer): Record<string, string> {
  return { offerId: offer.id };
}

function remainingDaysFor(slice: GateEntitlementSlice | undefined, now?: Date): number | null | undefined {
  if (!slice?.granted_at || !slice.access_type) return undefined;
  return getRemainingAccessDays(
    {
      access_type: slice.access_type,
      granted_at: slice.granted_at,
      access_days: slice.access_days,
    },
    now,
  );
}

export function mapYearGateCards(input: MapYearCardsInput): GateCard[] {
  const unlocked = new Set(
    input.entitlements
      .filter((entry) => entry.product === "knnp")
      .map((entry) => `${entry.track}:${entry.year}`),
  );

  return input.offers.map((offer) => {
    const isUnlocked = unlocked.has(`${offer.track}:${offer.year}`);
    const state = resolveGateCardState(offer.isFreeTest, isUnlocked);
    const featured = offer.track === input.selectedTrack && offer.year === input.selectedYear;
    const entitlement = input.entitlements.find(
      (entry) => entry.product === "knnp" && entry.track === offer.track && entry.year === offer.year,
    );
    return buildCard({
      offer,
      state,
      featured,
      featuredLabel: input.featuredLabel,
      kierunek: input.kierunekLabel(offer.track),
      rok: input.yearLabel(offer.year),
      summary: input.summary(offer.includesKey),
      quote: input.amountFor(offer),
      priceNotePaid: input.priceNotePaid,
      priceNoteTrial: input.priceNoteTrial,
      trialAmount: input.trialAmount,
      remainingDays: state === "owned" ? remainingDaysFor(entitlement, input.now) : undefined,
    });
  });
}

export function mapDurationGateCards(input: MapDurationCardsInput): GateCard[] {
  const owned = input.entitlements.find((entry) => entry.product === input.product);
  const matchingOffer =
    owned?.offer_key != null
      ? input.offers.find((offer) => offer.offerKey === owned.offer_key)
      : undefined;
  const fallbackOwnedId =
    matchingOffer?.id ?? (owned ? input.offers.find((offer) => offer.recommended)?.id : undefined);

  return input.offers.map((offer) => {
    const isUnlocked = fallbackOwnedId != null && offer.id === fallbackOwnedId;
    const state: GateCardState = isUnlocked ? "owned" : "locked";
    const featured = isUnlocked || (owned == null && Boolean(offer.recommended));
    return buildCard({
      offer,
      state,
      featured,
      featuredLabel: input.featuredLabel,
      kierunek: input.kierunek,
      rok: input.durationLabel(offer.accessDays),
      summary: input.summary(offer.includesKey),
      quote: input.amountFor(offer),
      priceNotePaid: input.priceNoteDuration(offer.accessDays),
      priceNoteTrial: "",
      trialAmount: "0 zł",
      remainingDays: isUnlocked ? remainingDaysFor(owned, input.now) : undefined,
    });
  });
}

function buildCard(args: {
  offer: GateOffer;
  state: GateCardState;
  featured: boolean;
  featuredLabel: string;
  kierunek: string;
  rok: string;
  summary: string;
  quote: OfferPriceQuote | undefined;
  priceNotePaid: string;
  priceNoteTrial: string;
  trialAmount: string;
  remainingDays?: number | null;
}): GateCard {
  const { offer, state } = args;
  const card: GateCard = {
    id: offer.id,
    kierunek: args.kierunek,
    rok: args.rok,
    state,
    featured: args.featured || undefined,
    featuredLabel: args.featured ? args.featuredLabel : undefined,
    summary: args.summary,
    enterFields: checkoutFields(offer),
  };

  if (state === "locked") {
    card.checkoutFields = checkoutFields(offer);
    card.price = {
      amount: args.quote?.amount ?? "—",
      note: args.priceNotePaid,
      perDay: args.quote?.perDay,
    };
  } else if (state === "trial") {
    card.activateFields = checkoutFields(offer);
    card.price = {
      amount: args.trialAmount,
      note: args.priceNoteTrial,
    };
    card.href = "/pulpit";
  } else {
    card.remainingDays = args.remainingDays;
    card.href = "/pulpit";
  }

  return card;
}
