import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeProcedureCost } from "@/features/kalkulator/lib/costing";

describe("computeProcedureCost", () => {
  it("liczy koszt TD-ABC dla typowej procedury 60 min", () => {
    const result = computeProcedureCost({
      durationMinutes: 60,
      assistantShare: 1,
      stationCostPerHour: 100,
      doctorRatePerHour: 200,
      assistantRatePerHour: 50,
      materialLines: [{ quantity: 2, unitCost: 10 }],
      price: 500,
    });

    assert.deepEqual(result, {
      stationCost: 100,
      laborCost: 250,
      materialCost: 20,
      totalCost: 370,
      marginPln: 130,
      marginPct: 26,
    });
  });

  it("zeruje marżę procentową gdy cena = 0", () => {
    const result = computeProcedureCost({
      durationMinutes: 30,
      assistantShare: 0.5,
      stationCostPerHour: 80,
      doctorRatePerHour: 150,
      assistantRatePerHour: 40,
      materialLines: [],
      price: 0,
    });

    assert.equal(result.marginPct, 0);
    assert.equal(result.marginPln, -125);
  });

  it("pomija koszt asysty gdy assistantShare = 0", () => {
    const result = computeProcedureCost({
      durationMinutes: 60,
      assistantShare: 0,
      stationCostPerHour: 50,
      doctorRatePerHour: 100,
      assistantRatePerHour: 999,
      materialLines: [{ quantity: 1, unitCost: 5 }],
      price: 200,
    });

    assert.equal(result.laborCost, 100);
    assert.equal(result.totalCost, 155);
    assert.equal(result.marginPln, 45);
  });

  it("zaokrągla wyniki do 2 miejsc po przecinku", () => {
    const result = computeProcedureCost({
      durationMinutes: 45,
      assistantShare: 1,
      stationCostPerHour: 33.33,
      doctorRatePerHour: 66.66,
      assistantRatePerHour: 11.11,
      materialLines: [{ quantity: 3, unitCost: 1.11 }],
      price: 100,
    });

    assert.equal(result.stationCost, 25);
    assert.equal(result.laborCost, 58.33);
    assert.equal(result.materialCost, 3.33);
    assert.equal(result.totalCost, 86.66);
    assert.equal(result.marginPln, 13.34);
    assert.equal(result.marginPct, 13.34);
  });
});
