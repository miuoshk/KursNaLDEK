import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getMarginTone,
  marginToneLabel,
  buildCostBreakdownSegments,
} from "@/features/kalkulator/lib/marginTone";
import { computeProcedureCost } from "@/features/kalkulator/lib/costing";

describe("marginTone", () => {
  it("stosuje progi marży z specyfikacji", () => {
    assert.equal(getMarginTone(25), "positive");
    assert.equal(getMarginTone(20), "warning");
    assert.equal(getMarginTone(15), "warning");
    assert.equal(getMarginTone(8), "warning");
    assert.equal(getMarginTone(7.9), "loss");
  });

  it("buduje rozbicie kosztu na 4 segmenty", () => {
    const result = computeProcedureCost({
      durationMinutes: 60,
      assistantShare: 1,
      stationCostPerHour: 100,
      doctorRatePerHour: 200,
      assistantRatePerHour: 50,
      materialLines: [{ quantity: 1, unitCost: 20 }],
      price: 500,
    });

    const segments = buildCostBreakdownSegments(500, result);
    assert.equal(segments.length, 4);
    assert.equal(segments[0]?.key, "station");
    assert.equal(segments[3]?.key, "margin");
    assert.equal(marginToneLabel(getMarginTone(result.marginPct)), "Marża powyżej 20%");
  });
});
