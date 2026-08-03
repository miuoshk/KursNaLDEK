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

/** Przedmioty widoczne wyłącznie dla kont preview (treść w trakcie przygotowania). */
export const PREVIEW_ONLY_STOMA_CATALOG_SUBJECT_IDS = new Set([
  "stoma-zarzadzanie",
  "stoma-przedsiebiorczosc",
]);

export const PREVIEW_CATALOG_SUBJECT_VIEWER_EMAILS = new Set([
  "milosz.krysiak@icloud.com",
]);

function canViewPreviewCatalogSubjects(viewerEmail?: string | null): boolean {
  if (!viewerEmail) return false;
  return PREVIEW_CATALOG_SUBJECT_VIEWER_EMAILS.has(viewerEmail.trim().toLowerCase());
}

export function isCatalogSubjectHidden(
  subjectId: string,
  track: StudyTrack,
  viewerEmail?: string | null,
): boolean {
  if (track !== "stomatologia") return false;

  if (PREVIEW_ONLY_STOMA_CATALOG_SUBJECT_IDS.has(subjectId)) {
    return !canViewPreviewCatalogSubjects(viewerEmail);
  }

  return HIDDEN_STOMA_CATALOG_SUBJECT_IDS.has(subjectId);
}

export function filterCatalogSubjectsForTrack<T extends { id: string }>(
  rows: T[],
  track?: StudyTrack,
  viewerEmail?: string | null,
): T[] {
  if (track !== "stomatologia") return rows;
  return rows.filter((row) => !isCatalogSubjectHidden(row.id, track, viewerEmail));
}
