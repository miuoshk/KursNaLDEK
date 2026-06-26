export type Procedure = {
  id: string;
  practice_id: string;
  name: string;
  price: number;
  duration_minutes: number;
  assistant_share: number;
  created_at: string;
  updated_at: string;
};

export type ProcedureMaterialLine = {
  id?: string;
  procedure_id?: string;
  material_id: string;
  default_quantity: number;
};

export type ProcedureWithMaterials = Procedure & {
  procedure_materials: Array<
    ProcedureMaterialLine & {
      material_catalog: {
        id: string;
        name: string;
        unit_label: string;
        unit_cost: number;
      } | null;
    }
  >;
};

export type ProcedureDraft = {
  name: string;
  price: string;
  duration_minutes: string;
  assistant_share_pct: string;
  materialLines: ProcedureMaterialLine[];
};
