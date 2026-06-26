"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createKalkulatorClient } from "@/features/kalkulator/lib/supabase";
import type { MaterialCatalogItem } from "@/features/kalkulator/types/catalog";
import type { ProcedureWithMaterials } from "@/features/kalkulator/types/procedure";

export function usePracticeDashboard(practiceId: string) {
  const supabase = useMemo(() => createKalkulatorClient(), []);
  const [procedures, setProcedures] = useState<ProcedureWithMaterials[]>([]);
  const [materials, setMaterials] = useState<MaterialCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [proceduresRes, materialsRes] = await Promise.all([
      supabase
        .from("procedures")
        .select(
          `
          *,
          procedure_materials (
            id,
            material_id,
            default_quantity,
            material_catalog (
              id,
              name,
              unit_label,
              unit_cost
            )
          )
        `,
        )
        .eq("practice_id", practiceId)
        .order("name"),
      supabase
        .from("material_catalog")
        .select("*")
        .eq("practice_id", practiceId)
        .order("name"),
    ]);

    if (proceduresRes.error || materialsRes.error) {
      setError("Nie udało się wczytać danych gabinetu.");
      setProcedures([]);
      setMaterials([]);
    } else {
      setProcedures((proceduresRes.data ?? []) as ProcedureWithMaterials[]);
      setMaterials((materialsRes.data ?? []) as MaterialCatalogItem[]);
    }

    setLoading(false);
  }, [practiceId, supabase]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { procedures, materials, loading, error, reload };
}
