import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getEntitlementExpiresAt,
  isEntitlementCurrentlyValid,
} from "@/features/access/lib/entitlementExpiry";

describe("entitlementExpiry", () => {
  it("paid access expires after 45 days", () => {
    const grantedAt = new Date("2026-01-01T12:00:00.000Z");
    const expiresAt = getEntitlementExpiresAt(grantedAt, "paid");
    assert.equal(expiresAt?.toISOString(), "2026-02-15T12:00:00.000Z");
  });

  it("free test access does not expire", () => {
    assert.equal(getEntitlementExpiresAt("2026-01-01T00:00:00.000Z", "free_test"), null);
    assert.equal(
      isEntitlementCurrentlyValid({
        access_type: "free_test",
        granted_at: "2020-01-01T00:00:00.000Z",
        active: true,
      }),
      true,
    );
  });

  it("rejects expired paid entitlements", () => {
    assert.equal(
      isEntitlementCurrentlyValid(
        {
          access_type: "paid",
          granted_at: "2026-01-01T00:00:00.000Z",
          active: true,
        },
        new Date("2026-03-01T00:00:00.000Z"),
      ),
      false,
    );
  });

  it("uses access_days when provided", () => {
    const grantedAt = new Date("2026-01-01T00:00:00.000Z");
    const expiresAt = getEntitlementExpiresAt(grantedAt, "paid", 365);
    assert.equal(expiresAt?.toISOString(), "2027-01-01T00:00:00.000Z");
  });

  it("accepts paid entitlements within the window", () => {
    assert.equal(
      isEntitlementCurrentlyValid(
        {
          access_type: "paid",
          granted_at: "2026-01-01T00:00:00.000Z",
          active: true,
        },
        new Date("2026-02-01T00:00:00.000Z"),
      ),
      true,
    );
  });
});
