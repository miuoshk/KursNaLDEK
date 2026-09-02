import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatOfferAmount, formatPricePerDay } from "./formatOfferPrice";

describe("formatOfferPrice", () => {
  it("formats the package amount without grosze", () => {
    assert.equal(formatOfferAmount(29900, "pln"), "299 zł");
  });

  it("formats per-day price for LDEW packages", () => {
    assert.equal(formatPricePerDay(29900, 30, "pln"), "9,97 zł");
    assert.equal(formatPricePerDay(149900, 180, "pln"), "8,33 zł");
    assert.equal(formatPricePerDay(269900, 365, "pln"), "7,39 zł");
  });

  it("skips invalid day windows", () => {
    assert.equal(formatPricePerDay(29900, 0, "pln"), undefined);
  });
});
