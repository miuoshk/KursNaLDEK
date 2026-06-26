import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeProcedureCost } from "@/features/kalkulator/lib/costing";
import { toLogResultSummary } from "@/features/kalkulator/lib/saveProcedureLog";

describe("saveProcedureLog helpers", () => {
  it("mapuje wynik kalkulacji na podsumowanie wizyty", () => {
    const cost = computeProcedureCost({
      durationMinutes: 30,
      assistantShare: 1,
      stationCostPerHour: 50,
      doctorRatePerHour: 100,
      assistantRatePerHour: 30,
      materialLines: [{ quantity: 2, unitCost: 5 }],
      price: 390,
    });

    const summary = toLogResultSummary(390, cost);
    assert.equal(summary.revenue, 390);
    assert.equal(summary.totalCost, cost.totalCost);
    assert.equal(summary.marginPct, cost.marginPct);
  });
});
