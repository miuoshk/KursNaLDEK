import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { KNNP_YEAR_OFFERS as YEAR_OFFERS, LDEW_DURATION_OFFERS as DURATION_OFFERS } from "@/features/access/lib/gateCatalog";
import { mapYearGateCards, mapDurationGateCards } from "@/features/access/lib/mapGateCards";
import { resolveGateCardState } from "@/features/access/lib/gateTypes";

describe("resolveGateCardState", () => {
  it("maps locked / trial / owned without mixing trial after unlock", () => {
    assert.equal(resolveGateCardState(false, false), "locked");
    assert.equal(resolveGateCardState(true, false), "trial");
    assert.equal(resolveGateCardState(true, true), "owned");
    assert.equal(resolveGateCardState(false, true), "owned");
  });
});

describe("mapYearGateCards", () => {
  const cards = mapYearGateCards({
    offers: YEAR_OFFERS,
    entitlements: [
      { product: "knnp", track: "stomatologia", year: 2, offer_key: null },
    ],
    selectedTrack: "stomatologia",
    selectedYear: 2,
    kierunekLabel: (track) => (track === "lekarski" ? "Lekarski" : "Stomatologia"),
    yearLabel: (year) => `Rok ${year}`,
    includes: () => ["a", "b", "c"],
    featuredLabel: "Twój rok",
    priceNotePaid: "jednorazowo",
    priceNoteTrial: "testowy",
    ownedNote: "opłacony",
    trialAmount: "0 zł",
    amountFor: () => "297 zł",
  });

  it("renders four KNNP cards with correct states", () => {
    assert.equal(cards.length, 4);
    assert.equal(cards.find((card) => card.id === "knnp-stomatologia-1")?.state, "locked");
    assert.equal(cards.find((card) => card.id === "knnp-stomatologia-2")?.state, "owned");
    assert.equal(cards.find((card) => card.id === "knnp-stomatologia-2")?.featured, true);
    assert.equal(cards.find((card) => card.id === "knnp-stomatologia-2")?.featuredLabel, "Twój rok");
    assert.equal(cards.find((card) => card.id === "knnp-lekarski-1")?.state, "locked");
  });

  it("puts price on locked cards and ownedNote on owned", () => {
    const locked = cards.find((card) => card.id === "knnp-stomatologia-1");
    const owned = cards.find((card) => card.id === "knnp-stomatologia-2");
    assert.equal(locked?.price?.amount, "297 zł");
    assert.ok(locked?.checkoutFields?.offerId);
    assert.equal(owned?.price, undefined);
    assert.equal(owned?.ownedNote, "opłacony");
  });
});

describe("mapDurationGateCards", () => {
  it("features recommended SKU when nothing is owned", () => {
    const cards = mapDurationGateCards({
      offers: DURATION_OFFERS,
      entitlements: [],
      product: "ldew",
      kierunek: "LDEW",
      durationLabel: (days) => `${days} dni`,
      includes: () => ["a", "b", "c"],
      featuredLabel: "Polecane",
      priceNoteDuration: (days) => `${days} dni`,
      ownedNote: "opłacony",
      amountFor: (offer) => (offer.id === "ldew-365" ? "2 699 zł" : "299 zł"),
    });
    assert.equal(cards.length, 3);
    assert.equal(cards.every((card) => card.state === "locked"), true);
    assert.equal(cards.find((card) => card.id === "ldew-365")?.featured, true);
    assert.equal(cards.find((card) => card.id === "ldew-180")?.featured, undefined);
    assert.equal(cards.find((card) => card.id === "ldew-30")?.kierunek, "LDEW");
  });

  it("marks only the purchased duration as owned", () => {
    const cards = mapDurationGateCards({
      offers: DURATION_OFFERS,
      entitlements: [
        { product: "ldew", track: "stomatologia", year: 1, offer_key: "ldew-365" },
      ],
      product: "ldew",
      kierunek: "LDEW",
      durationLabel: (days) => `${days} dni`,
      includes: () => ["a", "b", "c"],
      featuredLabel: "Polecane",
      priceNoteDuration: () => "nota",
      ownedNote: "opłacony",
      amountFor: () => "2 699 zł",
    });
    assert.equal(cards.find((card) => card.id === "ldew-365")?.state, "owned");
    assert.equal(cards.find((card) => card.id === "ldew-30")?.state, "locked");
    assert.equal(cards.find((card) => card.id === "ldew-180")?.state, "locked");
  });
});
