export type ProcedureLog = {
  id: string;
  practice_id: string;
  procedure_id: string;
  performed_at: string;
  snap_price: number;
  snap_station_cost: number;
  snap_labor_cost: number;
  snap_material_cost: number;
  snap_total_cost: number;
  snap_margin_pln: number;
  snap_margin_pct: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type LogMaterialLine = {
  material_id: string;
  material_name: string;
  unit_label: string;
  quantity: number;
  unit_cost: number;
};

export type LogResultSummary = {
  revenue: number;
  totalCost: number;
  marginPln: number;
  marginPct: number;
};
