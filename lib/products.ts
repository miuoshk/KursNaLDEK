export type QuestionSourceValue = "own" | "cem" | "uczelnia";

export const REFERENCE_SOURCES: Record<string, QuestionSourceValue[]> = {
  ldek: ["cem"],
  ldew: ["cem"],
  knnp: ["uczelnia", "cem"],
};

export const REFERENCE_LABEL: Record<string, string> = {
  ldek: "CEM",
  ldew: "CEM",
  knnp: "Z egzaminów",
};

export function referenceSources(product?: string | null): QuestionSourceValue[] {
  return (product && REFERENCE_SOURCES[product]) || [];
}

/** INFRASTRUKTURA: czy dla tego produktu pojęcie "referencyjne" ma sens. */
export function hasReferenceSources(product?: string | null): boolean {
  return referenceSources(product).length > 0;
}

/**
 * ROLLOUT: czy filtr jest RENDEROWANY. To osobna decyzja niż powyższa.
 * KNNP ma gotową infrastrukturę, ale świadomie nie jest jeszcze na live —
 * to inny kurs, o innym tempie. Włączenie = dopisanie 'knnp' do tej listy.
 */
const SOURCE_FILTER_LIVE = ["ldek", "ldew"];

export function isSourceFilterLive(product?: string | null): boolean {
  return !!product
    && SOURCE_FILTER_LIVE.includes(product)
    && hasReferenceSources(product);
}

/**
 * Egzaminy CEM (całe arkusze na czas) to OSOBNA funkcja, tylko dla CEM.
 * Kolokwium uczelniane nie ma formatu, który da się odtworzyć jako arkusz.
 */
export function hasCemExams(product?: string | null): boolean {
  return product === "ldek" || product === "ldew";
}
