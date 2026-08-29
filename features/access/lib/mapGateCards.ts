import type { GateOffer } from "@/features/access/lib/gateCatalog";
import type { GateCard, GateCardState } from "@/features/access/lib/gateTypes";
import { resolveGateCardState } from "@/features/access/lib/gateTypes";
import type { StudyProduct, StudyTrack, StudyYear } from "@/features/access/lib/studyAccess";

export type GateEntitlementSlice = {
  product: StudyProduct;
  track: StudyTrack;
  year: StudyYear;
  offer_key: string | null;
};

export type GateAmountLookup = (offer: GateOffer) => string | undefined;

type MapYearCardsInput = {
  offers: Extract<GateOffer, { kind: "year" }>[];
  entitlements: GateEntitlementSlice[];
  selectedTrack: StudyTrack;
  selectedYear: StudyYear;
  kierunekLabel: (track: StudyTrack) => string;
  yearLabel: (year: StudyYear) => string;
  includes: (key: Extract<GateOffer, { kind: "year" }>["includesKey"]) => string[];
  featuredLabel: string;
  priceNotePaid: string;
  priceNoteTrial: string;
  ownedNote: string;
  trialAmount: string;
  amountFor: GateAmountLookup;
};

type MapDurationCardsInput = {
  offers: Extract<GateOffer, { kind: "duration" }>[];
  entitlements: GateEntitlementSlice[];
  product: StudyProduct;
  kierunek: string;
  durationLabel: (days: number) => string;
  includes: (key: Extract<GateOffer, { kind: "duration" }>["includesKey"]) => string[];
  featuredLabel: string;
  priceNoteDuration: (days: number) => string;
  ownedNote: string;
  amountFor: GateAmountLookup;
};

function checkoutFields(offer: GateOffer): Record<string, string> {
  return { offerId: offer.id };
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
    return buildCard({
      offer,
      state,
      featured,
      featuredLabel: input.featuredLabel,
      kierunek: input.kierunekLabel(offer.track),
      rok: input.yearLabel(offer.year),
      includes: input.includes(offer.includesKey),
      amount: input.amountFor(offer),
      priceNotePaid: input.priceNotePaid,
      priceNoteTrial: input.priceNoteTrial,
      ownedNote: input.ownedNote,
      trialAmount: input.trialAmount,
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
      includes: input.includes(offer.includesKey),
      amount: input.amountFor(offer),
      priceNotePaid: input.priceNoteDuration(offer.accessDays),
      priceNoteTrial: "",
      ownedNote: input.ownedNote,
      trialAmount: "0 zł",
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
  includes: string[];
  amount: string | undefined;
  priceNotePaid: string;
  priceNoteTrial: string;
  ownedNote: string;
  trialAmount: string;
}): GateCard {
  const { offer, state } = args;
  const card: GateCard = {
    id: offer.id,
    kierunek: args.kierunek,
    rok: args.rok,
    state,
    featured: args.featured || undefined,
    featuredLabel: args.featured ? args.featuredLabel : undefined,
    includes: args.includes.slice(0, 3),
    enterFields: checkoutFields(offer),
  };

  if (state === "locked") {
    card.checkoutFields = checkoutFields(offer);
    card.price = {
      amount: args.amount ?? "—",
      note: args.priceNotePaid,
    };
  } else if (state === "trial") {
    card.activateFields = checkoutFields(offer);
    card.price = {
      amount: args.trialAmount,
      note: args.priceNoteTrial,
    };
    card.href = "/pulpit";
  } else {
    card.ownedNote = args.ownedNote;
    card.href = "/pulpit";
  }

  return card;
}
