import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_MATERIALS,
  PROCEDURE_MATERIAL_TEMPLATES,
  REFERENCE_PROCEDURES,
  type MaterialSeedKey,
  type ReferenceProcedureKey,
} from "@/features/kalkulator/data/benchmarks";

export type SeedPracticeDefaultsOptions = {
  includeMaterials?: boolean;
  includeProcedures?: boolean;
};

export type SeedPracticeDefaultsResult =
  | { ok: true; skipped: boolean }
  | { ok: false; error: string };

/**
 * Po zakończeniu wizarda — wstawia słownik materiałów, 4 procedury referencyjne
 * i domyślne koszyki materiałów (mediany licencjatu, n=106).
 * Idempotentne: pomija seed gdy gabinet ma już procedury / materiały.
 */
export async function seedPracticeDefaults(
  supabase: SupabaseClient,
  practiceId: string,
  options: SeedPracticeDefaultsOptions = {},
): Promise<SeedPracticeDefaultsResult> {
  const includeMaterials = options.includeMaterials ?? true;
  const includeProcedures = options.includeProcedures ?? true;

  if (!includeMaterials && !includeProcedures) {
    return { ok: true, skipped: true };
  }

  if (includeProcedures) {
    const { count, error: countError } = await supabase
      .from("procedures")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", practiceId);

    if (countError) {
      return { ok: false, error: countError.message };
    }

    if ((count ?? 0) > 0) {
      return { ok: true, skipped: true };
    }
  }

  let materialIdByKey = new Map<MaterialSeedKey, string>();

  if (includeMaterials) {
    const { count: materialCount, error: materialCountError } = await supabase
      .from("material_catalog")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", practiceId);

    if (materialCountError) {
      return { ok: false, error: materialCountError.message };
    }

    if ((materialCount ?? 0) === 0) {
      const { data: insertedMaterials, error: materialsError } = await supabase
        .from("material_catalog")
        .insert(
          DEFAULT_MATERIALS.map((material) => ({
            practice_id: practiceId,
            name: material.name,
            unit_label: material.unitLabel,
            unit_cost: material.unitCost,
            is_default: true,
          })),
        )
        .select("id, name");

      if (materialsError) {
        return { ok: false, error: materialsError.message };
      }

      for (const seed of DEFAULT_MATERIALS) {
        const row = insertedMaterials?.find((item) => item.name === seed.name);
        if (row?.id) {
          materialIdByKey.set(seed.key, row.id);
        }
      }
    } else if (includeProcedures) {
      const { data: existingMaterials, error: existingMaterialsError } = await supabase
        .from("material_catalog")
        .select("id, name")
        .eq("practice_id", practiceId);

      if (existingMaterialsError) {
        return { ok: false, error: existingMaterialsError.message };
      }

      for (const seed of DEFAULT_MATERIALS) {
        const row = existingMaterials?.find((item) => item.name === seed.name);
        if (row?.id) {
          materialIdByKey.set(seed.key, row.id);
        }
      }
    }
  }

  if (!includeProcedures) {
    return { ok: true, skipped: false };
  }

  const { data: insertedProcedures, error: proceduresError } = await supabase
    .from("procedures")
    .insert(
      REFERENCE_PROCEDURES.map((procedure) => ({
        practice_id: practiceId,
        name: procedure.name,
        price: procedure.price,
        duration_minutes: procedure.durationMinutes,
        assistant_share: 1,
      })),
    )
    .select("id, name");

  if (proceduresError) {
    return { ok: false, error: proceduresError.message };
  }

  const procedureIdByKey = new Map<ReferenceProcedureKey, string>();
  for (const seed of REFERENCE_PROCEDURES) {
    const row = insertedProcedures?.find((item) => item.name === seed.name);
    if (row?.id) {
      procedureIdByKey.set(seed.key, row.id);
    }
  }

  const procedureMaterialRows: {
    procedure_id: string;
    material_id: string;
    default_quantity: number;
  }[] = [];

  for (const procedure of REFERENCE_PROCEDURES) {
    const procedureId = procedureIdByKey.get(procedure.key);
    if (!procedureId) continue;

    const template = PROCEDURE_MATERIAL_TEMPLATES[procedure.key];
    for (const [materialKey, quantity] of Object.entries(template)) {
      const materialId = materialIdByKey.get(materialKey as MaterialSeedKey);
      if (!materialId || quantity == null) continue;

      procedureMaterialRows.push({
        procedure_id: procedureId,
        material_id: materialId,
        default_quantity: quantity,
      });
    }
  }

  if (procedureMaterialRows.length > 0) {
    const { error: templateError } = await supabase
      .from("procedure_materials")
      .insert(procedureMaterialRows);

    if (templateError) {
      return { ok: false, error: templateError.message };
    }
  }

  return { ok: true, skipped: false };
}
