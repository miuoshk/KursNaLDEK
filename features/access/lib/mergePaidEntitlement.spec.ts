import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolvePaidGrant } from "@/features/access/lib/mergePaidEntitlement";

describe("resolvePaidGrant", () => {
  it("uses the new purchase when nothing exists", () => {
    const now = new Date("2026-08-01T00:00:00.000Z");
    const grant = resolvePaidGrant({
      now,
      purchasedAccessDays: 30,
      purchasedOfferKey: "ldew-30",
      existing: null,
    });
    assert.equal(grant.access_days, 30);
    assert.equal(grant.offer_key, "ldew-30");
    assert.equal(grant.granted_at.toISOString(), now.toISOString());
  });

  it("does not shorten a longer remaining pack", () => {
    const now = new Date("2026-03-01T00:00:00.000Z");
    const grant = resolvePaidGrant({
      now,
      purchasedAccessDays: 30,
      purchasedOfferKey: "ldew-30",
      existing: {
        granted_at: "2026-01-01T00:00:00.000Z",
        access_days: 365,
        offer_key: "ldew-365",
      },
    });
    assert.equal(grant.access_days, 365);
    assert.equal(grant.offer_key, "ldew-365");
    assert.equal(grant.granted_at.toISOString(), "2026-01-01T00:00:00.000Z");
  });

  it("upgrades when the new pack expires later", () => {
    const now = new Date("2026-03-01T00:00:00.000Z");
    const grant = resolvePaidGrant({
      now,
      purchasedAccessDays: 365,
      purchasedOfferKey: "ldew-365",
      existing: {
        granted_at: "2026-02-01T00:00:00.000Z",
        access_days: 30,
        offer_key: "ldew-30",
      },
    });
    assert.equal(grant.access_days, 365);
    assert.equal(grant.offer_key, "ldew-365");
    assert.equal(grant.granted_at.toISOString(), now.toISOString());
  });
});
