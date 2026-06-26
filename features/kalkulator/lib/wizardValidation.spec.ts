import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeStationCostPerHour, sumMonthlyStationCosts } from "@/features/kalkulator/lib/stationCost";
import {
  validateWizardStep1,
  validateWizardStep2,
  validateWizardStep3,
} from "@/features/kalkulator/lib/wizardValidation";

describe("stationCost", () => {
  it("liczy koszt godziny jak trigger DB", () => {
    assert.equal(computeStationCostPerHour(8000, 160), 50);
    assert.equal(computeStationCostPerHour(1000, 200), 5);
  });

  it("sumuje składowe kosztów stałych", () => {
    assert.equal(
      sumMonthlyStationCosts({
        rent: 3000,
        utilities: 500,
        amortization: 400,
        admin: 100,
      }),
      4000,
    );
  });
});

describe("wizardValidation", () => {
  it("wymaga nazwy gabinetu w kroku 1", () => {
    const errors = validateWizardStep1({ name: "", city: "Kraków", voivodeship: "małopolskie" });
    assert.equal(errors.name, "Podaj nazwę gabinetu.");
  });

  it("wymaga dodatniego kosztu stałego w kroku 2", () => {
    const errors = validateWizardStep2({
      rent: "0",
      utilities: "0",
      amortization: "0",
      admin: "0",
      stationHoursPerMonth: "160",
    });
    assert.match(errors.rent ?? "", /Podaj koszt czynszu/);
  });

  it("wymaga stawki lekarza w kroku 3", () => {
    const errors = validateWizardStep3({
      doctorRatePerHour: "",
      assistantRatePerHour: "0",
    });
    assert.equal(errors.doctorRatePerHour, "Podaj stawkę kosztową lekarza za godzinę.");
  });
});
