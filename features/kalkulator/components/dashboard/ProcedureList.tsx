"use client";

import { cn } from "@/lib/utils";
import {
  getMarginTone,
  marginToneColor,
  marginToneLabel,
} from "@/features/kalkulator/lib/marginTone";
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
  onCreate: () => void;
};

function formatMargin(pct: number) {
  return `${pct.toLocaleString("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function ProcedureList({
  practice,
  procedures,
  materials,
  selectedId,
  onSelect,
  onCreate,
}: Props) {
  if (procedures.length === 0) {
    return (
      <div className="rounded-[var(--k-radius-card)] border border-dashed border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] p-8 text-center">
        <p className="font-body text-sm text-[color:var(--k-muted)]">
          Dodaj pierwszą procedurę albo zaimportuj benchmarki w onboardingu.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 rounded-[var(--k-radius-btn)] bg-[color:var(--k-accent)] px-4 py-2 font-body text-sm font-semibold text-[color:var(--k-text)]"
        >
          Dodaj procedurę
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--k-radius-card)] border border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[color:var(--k-border)] px-4 py-3">
        <h2 className="font-body text-sm font-semibold text-[color:var(--k-text)]">Procedury</h2>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-[var(--k-radius-btn)] border border-[color:var(--k-border)] px-3 py-1.5 font-body text-xs text-[color:var(--k-text)] hover:border-[color:var(--k-primary-light)]"
        >
          Dodaj procedurę
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-[color:var(--k-border)] bg-[color:var(--k-page-bg)]">
              {["Nazwa", "Cena", "Czas", "Marża"].map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 text-left font-body text-xs font-medium uppercase tracking-wide text-[color:var(--k-muted)]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {procedures.map((procedure) => {
              const materialLines = procedure.procedure_materials.map((line) => ({
                material_id: line.material_id,
                default_quantity: Number(line.default_quantity),
              }));
              const result = computeProcedurePreview(practice, procedure, materialLines, materials);
              const tone = getMarginTone(result.marginPct);

              return (
                <tr
                  key={procedure.id}
                  className={cn(
                    "cursor-pointer border-b border-[color:var(--k-border)] transition hover:bg-[color:var(--k-page-bg)]",
                    selectedId === procedure.id && "bg-[color:var(--k-primary)]/5",
                  )}
                  onClick={() => onSelect(procedure.id)}
                >
                  <td className="px-4 py-3 font-body text-sm text-[color:var(--k-text)]">
                    {procedure.name}
                  </td>
                  <td className="kalkulator-tabular px-4 py-3 font-body text-sm text-[color:var(--k-text)]">
                    {Number(procedure.price).toLocaleString("pl-PL")} PLN
                  </td>
                  <td className="kalkulator-tabular px-4 py-3 font-body text-sm text-[color:var(--k-muted)]">
                    {procedure.duration_minutes} min
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-2 font-body text-sm font-medium"
                      style={{ color: marginToneColor(tone) }}
                      title={marginToneLabel(tone)}
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: marginToneColor(tone) }}
                        aria-hidden
                      />
                      <span className="kalkulator-tabular">{formatMargin(result.marginPct)}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
