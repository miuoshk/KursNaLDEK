import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MATERIALS,
  MATERIAL_PRICE_DISCLAIMER,
  PROCEDURE_MATERIAL_TEMPLATES,
  REFERENCE_PROCEDURES,
  getCostStructureHint,
  getMaterialSeed,
  getReferenceProcedure,
  type MaterialSeedKey,
  type ReferenceProcedureKey,
} from "@/features/kalkulator/data/benchmarks";

describe("kalkulator benchmarks (licencjat n=106)", () => {
  it("ma 4 procedury referencyjne z medianami", () => {
    assert.equal(REFERENCE_PROCEDURES.length, 4);

    const endo = getReferenceProcedure("endo");
    assert.equal(endo?.price, 1000);
    assert.equal(endo?.durationMinutes, 60);
    assert.equal(endo?.materialSharePct, 20);

    const kompozyt = getReferenceProcedure("kompozyt");
    assert.equal(kompozyt?.price, 390);
    assert.equal(kompozyt?.durationMinutes, 30);
    assert.equal(kompozyt?.materialSharePct, 10);

    const korona = getReferenceProcedure("korona");
    assert.equal(korona?.price, 2100);
    assert.equal(korona?.externalLab, true);
  });

  it("ma 10 predefiniowanych materiałów endo/kompozyt", () => {
    assert.equal(DEFAULT_MATERIALS.length, 10);
    assert.equal(getMaterialSeed("gutaperka")?.unitCost, 1.5);
    assert.equal(getMaterialSeed("kompozyt")?.unitCost, 5);
  });

  it("ma struktury kosztów endo i kompozyt z Wykresu 2 licencjatu", () => {
    const endo = getCostStructureHint("endo");
    assert.deepEqual(
      [
        endo?.materialsPct,
        endo?.doctorPct,
        endo?.assistantPct,
        endo?.amortizationPct,
        endo?.localPct,
        endo?.adminPct,
        endo?.marginPct,
      ],
      [20, 40, 10, 5, 5, 5, 15],
    );

    const kompozyt = getCostStructureHint("kompozyt");
    assert.deepEqual(
      [
        kompozyt?.materialsPct,
        kompozyt?.doctorPct,
        kompozyt?.assistantPct,
        kompozyt?.amortizationPct,
        kompozyt?.localPct,
        kompozyt?.adminPct,
        kompozyt?.marginPct,
      ],
      [10, 40, 10, 5, 5, 5, 20],
    );
  });

  it("łączy szablony materiałów tylko z istniejącymi kluczami seeda", () => {
    const materialKeys = new Set(DEFAULT_MATERIALS.map((m) => m.key));
    const procedureKeys = new Set(REFERENCE_PROCEDURES.map((p) => p.key));

    for (const [procedureKey, template] of Object.entries(PROCEDURE_MATERIAL_TEMPLATES)) {
      assert.ok(procedureKeys.has(procedureKey as ReferenceProcedureKey));
      for (const materialKey of Object.keys(template)) {
        assert.ok(materialKeys.has(materialKey as MaterialSeedKey));
      }
    }
  });

  it("eksponuje disclaimer o cenach orientacyjnych", () => {
    assert.match(MATERIAL_PRICE_DISCLAIMER, /edytuj pod swój gabinet/i);
  });
});
