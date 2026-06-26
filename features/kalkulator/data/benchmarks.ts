/** Etykieta UI — ceny materiałów z seeda są orientacyjne. */
export const MATERIAL_PRICE_DISCLAIMER =
  "Ceny orientacyjne — edytuj pod swój gabinet";

export type MaterialSeedKey =
  | "gutaperka"
  | "saczki"
  | "naocl"
  | "edta"
  | "koferdam"
  | "pilniki"
  | "uszczelniacz"
  | "kompozyt"
  | "bonding"
  | "znieczulenie";

export interface MaterialSeed {
  key: MaterialSeedKey;
  name: string;
  unitLabel: string;
  /** Koszt orientacyjny [PLN] — do edycji przez użytkownika. */
  unitCost: number;
}

/** Predefiniowany słownik materiałów (mediany / orientacyjne ceny jednostkowe). */
export const DEFAULT_MATERIALS: readonly MaterialSeed[] = [
  { key: "gutaperka", name: "Gutaperka ćwieki", unitLabel: "szt", unitCost: 1.5 },
  { key: "saczki", name: "Sączki papierowe", unitLabel: "szt", unitCost: 0.3 },
  { key: "naocl", name: "NaOCl 5,25%", unitLabel: "ml", unitCost: 0.1 },
  { key: "edta", name: "EDTA", unitLabel: "ml", unitCost: 0.2 },
  { key: "koferdam", name: "Koferdam", unitLabel: "szt", unitCost: 4 },
  { key: "pilniki", name: "Pilniki maszynowe (zużycie)", unitLabel: "szt", unitCost: 8 },
  {
    key: "uszczelniacz",
    name: "Materiał do wypełnienia kanału / uszczelniacz",
    unitLabel: "porcja",
    unitCost: 6,
  },
  { key: "kompozyt", name: "Kompozyt", unitLabel: "porcja", unitCost: 5 },
  { key: "bonding", name: "System wiążący / bonding", unitLabel: "porcja", unitCost: 3 },
  { key: "znieczulenie", name: "Znieczulenie", unitLabel: "ampułka", unitCost: 2.5 },
] as const;

export type ReferenceProcedureKey = "przeglad" | "kompozyt" | "endo" | "korona";

export type MaterialShareBenchmark = "low" | "pct" | "external_lab";

export interface ReferenceProcedureSeed {
  key: ReferenceProcedureKey;
  name: string;
  /** Mediana ceny z badania (n=106) [PLN]. */
  price: number;
  /** Mediana czasu klinicznego [min]. */
  durationMinutes: number;
  materialShareBenchmark: MaterialShareBenchmark;
  /** Udział materiałów w cenie — tylko gdy materialShareBenchmark === "pct". */
  materialSharePct?: number;
  /** Klucz do costStructureHints — podpowiedź struktury kosztów z Wykresu 2. */
  costStructureHintKey?: CostStructureHintKey;
  /** Korona — praca laboratoryjna poza gabinetem. */
  externalLab?: boolean;
}

/** 4 procedury referencyjne z medianami licencjatu (n=106). */
export const REFERENCE_PROCEDURES: readonly ReferenceProcedureSeed[] = [
  {
    key: "przeglad",
    name: "Przegląd stomatologiczny",
    price: 150,
    durationMinutes: 15,
    materialShareBenchmark: "low",
  },
  {
    key: "kompozyt",
    name: "Wypełnienie kompozyt 1-pow.",
    price: 390,
    durationMinutes: 30,
    materialShareBenchmark: "pct",
    materialSharePct: 10,
    costStructureHintKey: "kompozyt",
  },
  {
    key: "endo",
    name: "Endo 1-kanałowe",
    price: 1000,
    durationMinutes: 60,
    materialShareBenchmark: "pct",
    materialSharePct: 20,
    costStructureHintKey: "endo",
  },
  {
    key: "korona",
    name: "Korona pełnoceramiczna",
    price: 2100,
    durationMinutes: 60,
    materialShareBenchmark: "external_lab",
    externalLab: true,
  },
] as const;

export type CostStructureHintKey = "endo" | "kompozyt";

/** Struktura kosztów referencyjna (Wykres 2 licencjatu) — podpowiedzi w wizardzie. */
export interface CostStructureHint {
  key: CostStructureHintKey;
  label: string;
  materialsPct: number;
  doctorPct: number;
  assistantPct: number;
  amortizationPct: number;
  localPct: number;
  adminPct: number;
  marginPct: number;
}

export const COST_STRUCTURE_HINTS: readonly CostStructureHint[] = [
  {
    key: "endo",
    label: "Endo 1-kanałowe",
    materialsPct: 20,
    doctorPct: 40,
    assistantPct: 10,
    amortizationPct: 5,
    localPct: 5,
    adminPct: 5,
    marginPct: 15,
  },
  {
    key: "kompozyt",
    label: "Wypełnienie kompozyt 1-pow.",
    materialsPct: 10,
    doctorPct: 40,
    assistantPct: 10,
    amortizationPct: 5,
    localPct: 5,
    adminPct: 5,
    marginPct: 20,
  },
] as const;

/**
 * Domyślny koszyk materiałów per procedura (template procedure_materials).
 * Ilości są startowe — użytkownik edytuje w gabinecie.
 */
export const PROCEDURE_MATERIAL_TEMPLATES: Readonly<
  Record<ReferenceProcedureKey, Readonly<Partial<Record<MaterialSeedKey, number>>>>
> = {
  przeglad: {},
  kompozyt: {
    kompozyt: 1,
    bonding: 1,
    znieczulenie: 1,
  },
  endo: {
    gutaperka: 4,
    saczki: 10,
    naocl: 5,
    edta: 5,
    koferdam: 1,
    pilniki: 1,
    uszczelniacz: 1,
    znieczulenie: 2,
  },
  korona: {},
};

export function getCostStructureHint(
  key: CostStructureHintKey,
): CostStructureHint | undefined {
  return COST_STRUCTURE_HINTS.find((hint) => hint.key === key);
}

export function getMaterialSeed(key: MaterialSeedKey): MaterialSeed | undefined {
  return DEFAULT_MATERIALS.find((material) => material.key === key);
}

export function getReferenceProcedure(
  key: ReferenceProcedureKey,
): ReferenceProcedureSeed | undefined {
  return REFERENCE_PROCEDURES.find((procedure) => procedure.key === key);
}
