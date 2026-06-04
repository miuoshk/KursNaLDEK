import type { StudyTrack } from "@/features/access/lib/studyAccess";

/** Mapowanie kanonicznych repozytoriów na id przedmiotu w UI danego kierunku. */
const CANONICAL_TO_TRACK_SUBJECT: Record<
  StudyTrack,
  Record<string, string>
> = {
  stomatologia: {
    anatomia: "stoma-anatomia",
    histologia: "stoma-histologia",
    biofizyka: "stoma-biofizyka",
    fizjologia: "stoma-fizjologia",
    mikrobiologia: "stoma-mikrobio",
    farmakologia: "stoma-farmakologia",
  },
  lekarski: {
    anatomia: "lek-anatomia",
    histologia: "lek-histologia",
    biofizyka: "lek-biofizyka",
    fizjologia: "lek-fizjologia",
    mikrobiologia: "lek-mikrobio",
    farmakologia: "lek-farmakologia",
  },
};

/** Id przedmiotu do parametru `subject` w katalogu (track-specific zamiast kanonicznego). */
export function resolveCatalogSubjectId(
  subjectId: string,
  track: StudyTrack,
): string {
  return CANONICAL_TO_TRACK_SUBJECT[track][subjectId] ?? subjectId;
}
