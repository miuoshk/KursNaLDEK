import type { StudyTrack } from "@/features/access/lib/studyAccess";

/**
 * Powłoki STOMA ukryte w katalogu użytkownika (zostają w DB — planowane na przyszłość).
 * STOMA rok 2 jest darmowy; współdzielona treść (np. fizjologia) nie może omijać paywalla LEK r.2.
 */
export const HIDDEN_STOMA_CATALOG_SUBJECT_IDS = new Set([
  "stoma-biochemia",
  "stoma-fizjologia",
  "stoma-mikrobio",
  "stoma-mikrobio-ju",
]);

export function isCatalogSubjectHidden(
  subjectId: string,
  track: StudyTrack,
): boolean {
  return track === "stomatologia" && HIDDEN_STOMA_CATALOG_SUBJECT_IDS.has(subjectId);
}

export function filterCatalogSubjectsForTrack<T extends { id: string }>(
  rows: T[],
  track?: StudyTrack,
): T[] {
  if (track !== "stomatologia") return rows;
  return rows.filter((row) => !HIDDEN_STOMA_CATALOG_SUBJECT_IDS.has(row.id));
}
