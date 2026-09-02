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
      {
        product: "knnp",
        track: "stomatologia",
        year: 2,
        offer_key: null,
        access_type: "free_test",
        granted_at: "2026-01-01T00:00:00.000Z",
      },
    ],
    selectedTrack: "stomatologia",
    selectedYear: 2,
    kierunekLabel: (track) => (track === "lekarski" ? "Lekarski" : "Stomatologia"),
    yearLabel: (year) => `Rok ${year}`,
    summary: () => "Przedmioty tego roku",
    featuredLabel: "Twój rok",
    priceNotePaid: "jednorazowo",
    priceNoteTrial: "testowy",
    trialAmount: "0 zł",
    amountFor: () => ({ amount: "297 zł" }),
  });

  it("renders four KNNP cards with correct states", () => {
    assert.equal(cards.length, 4);
    assert.equal(cards.find((card) => card.id === "knnp-stomatologia-1")?.state, "locked");
    assert.equal(cards.find((card) => card.id === "knnp-stomatologia-2")?.state, "owned");
    assert.equal(cards.find((card) => card.id === "knnp-stomatologia-2")?.featured, true);
    assert.equal(cards.find((card) => card.id === "knnp-stomatologia-2")?.featuredLabel, "Twój rok");
    assert.equal(cards.find((card) => card.id === "knnp-lekarski-1")?.state, "locked");
  });

  it("puts price on locked cards and remaining days only on paid owned", () => {
    const locked = cards.find((card) => card.id === "knnp-stomatologia-1");
    const owned = cards.find((card) => card.id === "knnp-stomatologia-2");
    assert.equal(locked?.price?.amount, "297 zł");
    assert.ok(locked?.checkoutFields?.offerId);
    assert.equal(locked?.summary, "Przedmioty tego roku");
    assert.equal(owned?.price, undefined);
    assert.equal(owned?.remainingDays, null);
  });

  it("counts remaining paid days", () => {
    const paid = mapYearGateCards({
      offers: YEAR_OFFERS,
      entitlements: [
        {
          product: "knnp",
          track: "stomatologia",
          year: 1,
          offer_key: null,
          access_type: "paid",
          granted_at: "2026-01-01T00:00:00.000Z",
          access_days: 45,
        },
      ],
      selectedTrack: "stomatologia",
      selectedYear: 1,
      kierunekLabel: () => "Stomatologia",
      yearLabel: (year) => `Rok ${year}`,
      summary: () => "x",
      featuredLabel: "Twój rok",
      priceNotePaid: "jednorazowo",
      priceNoteTrial: "testowy",
      trialAmount: "0 zł",
      amountFor: () => ({ amount: "297 zł" }),
      now: new Date("2026-01-10T00:00:00.000Z"),
    });
    assert.equal(paid.find((card) => card.id === "knnp-stomatologia-1")?.remainingDays, 36);
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
      summary: () => "Sprint",
      featuredLabel: "Polecane",
      priceNoteDuration: (days) => `${days} dni`,
      amountFor: (offer) =>
        offer.id === "ldew-365"
          ? { amount: "2 699 zł", perDay: "7,39 zł" }
          : { amount: "299 zł", perDay: "9,97 zł" },
    });
    assert.equal(cards.length, 3);
    assert.equal(cards.every((card) => card.state === "locked"), true);
    assert.equal(cards.find((card) => card.id === "ldew-365")?.featured, true);
    assert.equal(cards.find((card) => card.id === "ldew-180")?.featured, undefined);
    assert.equal(cards.find((card) => card.id === "ldew-30")?.kierunek, "LDEW");
    assert.equal(cards.find((card) => card.id === "ldew-30")?.price?.perDay, "9,97 zł");
  });

  it("marks only the purchased duration as owned and exposes remaining days", () => {
    const cards = mapDurationGateCards({
      offers: DURATION_OFFERS,
      entitlements: [
        {
          product: "ldew",
          track: "stomatologia",
          year: 1,
          offer_key: "ldew-365",
          access_type: "paid",
          granted_at: "2026-01-01T00:00:00.000Z",
          access_days: 365,
        },
      ],
      product: "ldew",
      kierunek: "LDEW",
      durationLabel: (days) => `${days} dni`,
      summary: () => "Cykl",
      featuredLabel: "Polecane",
      priceNoteDuration: () => "nota",
      amountFor: () => ({ amount: "2 699 zł" }),
      now: new Date("2026-01-31T00:00:00.000Z"),
    });
    assert.equal(cards.find((card) => card.id === "ldew-365")?.state, "owned");
    assert.equal(cards.find((card) => card.id === "ldew-365")?.remainingDays, 335);
    assert.equal(cards.find((card) => card.id === "ldew-30")?.state, "locked");
    assert.equal(cards.find((card) => card.id === "ldew-180")?.state, "locked");
  });
});
