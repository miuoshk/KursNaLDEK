"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogMaterialLine } from "@/features/kalkulator/types/log";

type Props = {
  lines: LogMaterialLine[];
  onChange: (lines: LogMaterialLine[]) => void;
  kiosk?: boolean;
};

function adjustQuantity(lines: LogMaterialLine[], index: number, delta: number): LogMaterialLine[] {
  return lines.map((line, i) => {
    if (i !== index) return line;
    const next = Math.max(0, round3(line.quantity + delta));
    return { ...line, quantity: next };
  });
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

export function LogMaterialAdjustList({ lines, onChange, kiosk = false }: Props) {
  if (lines.length === 0) {
    return (
      <p className="font-body text-sm text-[color:var(--k-muted)]">
        Ta procedura nie ma materiałów w szablonie — zapisz wykonanie bez korekty koszyka.
      </p>
    );
  }

  const buttonSize = kiosk ? "size-14" : "size-10";
  const textSize = kiosk ? "text-xl" : "text-base";

  return (
    <ul className="space-y-2">
      {lines.map((line, index) => (
        <li
          key={line.material_id}
          className={cn(
            "flex items-center justify-between gap-3 rounded-[var(--k-radius-btn)] border border-[color:var(--k-border)] bg-white",
            kiosk ? "px-4 py-4" : "px-3 py-3",
          )}
        >
          <div className="min-w-0 flex-1">
            <p className={cn("font-body font-medium text-[color:var(--k-text)]", textSize)}>
              {line.material_name}
            </p>
            <p className="font-body text-xs text-[color:var(--k-muted)]">
              {line.unit_label} · {line.unit_cost.toLocaleString("pl-PL")} PLN/j.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Mniej ${line.material_name}`}
              onClick={() => onChange(adjustQuantity(lines, index, -1))}
              className={cn(
                buttonSize,
                "flex items-center justify-center rounded-[var(--k-radius-btn)] border border-[color:var(--k-border)] text-[color:var(--k-text)] transition hover:border-[color:var(--k-primary-light)] active:scale-95",
              )}
            >
              <Minus className={kiosk ? "size-6" : "size-4"} aria-hidden />
            </button>
            <span
              className={cn(
                "kalkulator-tabular min-w-[2.5rem] text-center font-body font-semibold text-[color:var(--k-text)]",
                textSize,
              )}
            >
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label={`Więcej ${line.material_name}`}
              onClick={() => onChange(adjustQuantity(lines, index, 1))}
              className={cn(
                buttonSize,
                "flex items-center justify-center rounded-[var(--k-radius-btn)] border border-[color:var(--k-primary-light)] bg-[color:var(--k-primary)]/10 text-[color:var(--k-primary)] transition active:scale-95",
              )}
            >
              <Plus className={kiosk ? "size-6" : "size-4"} aria-hidden />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function materialLinesFromProcedure(
  procedure: {
    procedure_materials: Array<{
      material_id: string;
      default_quantity: number;
      material_catalog: {
        name: string;
        unit_label: string;
        unit_cost: number;
      } | null;
    }>;
  },
): LogMaterialLine[] {
  return procedure.procedure_materials
    .map((line) => {
      const catalog = line.material_catalog;
      if (!catalog) return null;
      return {
        material_id: line.material_id,
        material_name: catalog.name,
        unit_label: catalog.unit_label,
        quantity: Number(line.default_quantity),
        unit_cost: Number(catalog.unit_cost),
      };
    })
    .filter((line): line is LogMaterialLine => line != null);
}
