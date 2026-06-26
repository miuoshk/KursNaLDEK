import type { CostInputs, CostResult } from "@/features/kalkulator/lib/costing";
import { computeProcedureCost } from "@/features/kalkulator/lib/costing";
import type { MaterialCatalogItem } from "@/features/kalkulator/types/catalog";
import type { Practice } from "@/features/kalkulator/types/practice";
import type { Procedure, ProcedureMaterialLine } from "@/features/kalkulator/types/procedure";

export function buildMaterialLines(
  lines: ProcedureMaterialLine[],
  catalog: MaterialCatalogItem[],
): { quantity: number; unitCost: number }[] {
  const catalogById = new Map(catalog.map((item) => [item.id, item]));

  return lines
    .map((line) => {
      const material = catalogById.get(line.material_id);
      if (!material || line.default_quantity <= 0) return null;
      return {
        quantity: line.default_quantity,
        unitCost: Number(material.unit_cost),
      };
    })
    .filter((line): line is { quantity: number; unitCost: number } => line != null);
}

export function computeProcedurePreview(
  practice: Practice,
  procedure: Pick<Procedure, "price" | "duration_minutes" | "assistant_share">,
  materialLines: ProcedureMaterialLine[],
  catalog: MaterialCatalogItem[],
): CostResult {
  const inputs: CostInputs = {
    durationMinutes: procedure.duration_minutes,
    assistantShare: Number(procedure.assistant_share),
    stationCostPerHour: Number(practice.station_cost_per_hour ?? 0),
    doctorRatePerHour: Number(practice.doctor_rate_per_hour ?? 0),
    assistantRatePerHour: Number(practice.assistant_rate_per_hour ?? 0),
    materialLines: buildMaterialLines(materialLines, catalog),
    price: Number(procedure.price),
  };

  return computeProcedureCost(inputs);
}
