/**
 * Przedmioty STOMA r.1 bez wyjaśnień w UI (sesja, katalog).
 * explanation w DB może istnieć (admin, kopiowanie) — student go nie widzi.
 */
export const STOMA_Y1_SUBJECTS_WITHOUT_EXPLANATION = new Set([
  "stoma-angielski",
]);

export function isExplanationHiddenForSubject(subjectId: string): boolean {
  return STOMA_Y1_SUBJECTS_WITHOUT_EXPLANATION.has(subjectId);
}
