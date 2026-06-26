"use client";

import { cn } from "@/lib/utils";
import { getMarginTone, marginToneColor } from "@/features/kalkulator/lib/marginTone";
import { computeProcedurePreview } from "@/features/kalkulator/lib/procedureCosting";
import type { MaterialCatalogItem } from "@/features/kalkulator/types/catalog";
import type { Practice } from "@/features/kalkulator/types/practice";
import type { ProcedureWithMaterials } from "@/features/kalkulator/types/procedure";

type Props = {
  practice: Practice;
  procedures: ProcedureWithMaterials[];
  materials: MaterialCatalogItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  kiosk?: boolean;
};

export function ProcedureTilePicker({
  practice,
  procedures,
  materials,
  selectedId,
  onSelect,
  kiosk = false,
}: Props) {
  if (procedures.length === 0) {
    return (
      <p className="font-body text-sm text-[color:var(--k-muted)]">
        Brak procedur. Dodaj procedurę w zakładce Procedury.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-3",
        kiosk ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {procedures.map((procedure) => {
        const materialLines = procedure.procedure_materials.map((line) => ({
          material_id: line.material_id,
          default_quantity: Number(line.default_quantity),
        }));
        const preview = computeProcedurePreview(practice, procedure, materialLines, materials);
        const tone = getMarginTone(preview.marginPct);
        const selected = selectedId === procedure.id;

        return (
          <button
            key={procedure.id}
            type="button"
            onClick={() => onSelect(procedure.id)}
            className={cn(
              "rounded-[var(--k-radius-card)] border bg-[color:var(--k-card-bg)] text-left transition",
              kiosk ? "p-6" : "p-4",
              selected
                ? "border-[color:var(--k-primary-light)] ring-2 ring-[color:var(--k-primary-light)]/30"
                : "border-[color:var(--k-border)] hover:border-[color:var(--k-primary-light)]/60",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "font-body font-semibold text-[color:var(--k-text)]",
                  kiosk ? "text-lg" : "text-sm",
                )}
              >
                {procedure.name}
              </span>
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: marginToneColor(tone) }}
                aria-hidden
              />
            </div>
            <p
              className={cn(
                "kalkulator-tabular mt-2 text-[color:var(--k-muted)]",
                kiosk ? "text-base" : "text-sm",
              )}
            >
              {Number(procedure.price).toLocaleString("pl-PL")} PLN · {procedure.duration_minutes}{" "}
              min
            </p>
          </button>
        );
      })}
    </div>
  );
}
