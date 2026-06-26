import {
  COST_STRUCTURE_HINTS,
  REFERENCE_PROCEDURES,
  type ReferenceProcedureSeed,
} from "@/features/kalkulator/data/benchmarks";

/** Dopasowanie procedury gabinetu do benchmarku licencjatu (n=106). */
export function matchReferenceProcedure(procedureName: string): ReferenceProcedureSeed | undefined {
  const normalized = procedureName.trim().toLowerCase();

  const exact = REFERENCE_PROCEDURES.find(
    (item) => item.name.toLowerCase() === normalized,
  );
  if (exact) return exact;

  if (normalized.includes("endo")) {
    return REFERENCE_PROCEDURES.find((item) => item.key === "endo");
  }
  if (normalized.includes("kompozyt") || normalized.includes("wypełnien")) {
    return REFERENCE_PROCEDURES.find((item) => item.key === "kompozyt");
  }
  if (normalized.includes("przegląd") || normalized.includes("przeglad")) {
    return REFERENCE_PROCEDURES.find((item) => item.key === "przeglad");
  }
  if (normalized.includes("koron")) {
    return REFERENCE_PROCEDURES.find((item) => item.key === "korona");
  }

  return undefined;
}

export function getBenchmarkMarginPct(reference: ReferenceProcedureSeed): number {
  if (reference.costStructureHintKey) {
    const hint = COST_STRUCTURE_HINTS.find((item) => item.key === reference.costStructureHintKey);
    if (hint) return hint.marginPct;
  }
  return 15;
}

export function getMarketPriceRange(reference: ReferenceProcedureSeed): {
  low: number;
  high: number;
} {
  const high = reference.price;
  const low = Math.round(high * 0.9);
  return { low, high };
}

export function getProcedureShortLabel(procedureName: string, reference?: ReferenceProcedureSeed): string {
  if (reference?.key === "endo") return "endo";
  if (reference?.key === "kompozyt") return "kompozyt";
  if (reference?.key === "przeglad") return "przegląd";
  if (reference?.key === "korona") return "korona";
  return procedureName.split(/\s+/)[0]?.toLowerCase() ?? procedureName;
}
