export type MaterialCatalogItem = {
  id: string;
  practice_id: string;
  name: string;
  unit_label: string;
  unit_cost: number;
  is_default: boolean;
  created_at: string;
};

export type MaterialCatalogDraft = {
  name: string;
  unit_label: string;
  unit_cost: string;
};
