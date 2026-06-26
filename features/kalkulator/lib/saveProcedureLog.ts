import type { SupabaseClient } from "@supabase/supabase-js";
import type { CostResult } from "@/features/kalkulator/lib/costing";
import type { LogMaterialLine } from "@/features/kalkulator/types/log";

const round2 = (n: number) => Math.round(n * 100) / 100;

export type SaveProcedureLogInput = {
  practiceId: string;
  procedureId: string;
  performedAt: string;
  createdBy: string;
  price: number;
  costResult: CostResult;
  materialLines: LogMaterialLine[];
};

export type SaveProcedureLogResult =
  | { ok: true; logId: string }
  | { ok: false; error: string };

export async function saveProcedureLog(
  supabase: SupabaseClient,
  input: SaveProcedureLogInput,
): Promise<SaveProcedureLogResult> {
  const { data: logRow, error: logError } = await supabase
    .from("procedure_logs")
    .insert({
      practice_id: input.practiceId,
      procedure_id: input.procedureId,
      performed_at: input.performedAt,
      snap_price: input.price,
      snap_station_cost: input.costResult.stationCost,
      snap_labor_cost: input.costResult.laborCost,
      snap_material_cost: input.costResult.materialCost,
      snap_total_cost: input.costResult.totalCost,
      snap_margin_pln: input.costResult.marginPln,
      snap_margin_pct: input.costResult.marginPct,
      created_by: input.createdBy,
    })
    .select("id")
    .single();

  if (logError || !logRow) {
    return { ok: false, error: logError?.message ?? "Nie udało się zapisać logu." };
  }

  const usageRows = input.materialLines
    .filter((line) => line.quantity > 0)
    .map((line) => ({
      log_id: logRow.id,
      material_name: line.material_name,
      quantity: line.quantity,
      unit_cost: line.unit_cost,
      line_cost: round2(line.quantity * line.unit_cost),
    }));

  if (usageRows.length > 0) {
    const { error: usageError } = await supabase.from("log_material_usage").insert(usageRows);
    if (usageError) {
      return { ok: false, error: usageError.message };
    }
  }

  return { ok: true, logId: logRow.id };
}

export function toLogResultSummary(price: number, costResult: CostResult) {
  return {
    revenue: price,
    totalCost: costResult.totalCost,
    marginPln: costResult.marginPln,
    marginPct: costResult.marginPct,
  };
}
