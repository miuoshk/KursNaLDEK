import { z } from "zod";

export const STUDY_TRACKS = ["stomatologia", "lekarski"] as const;
export const STUDY_YEARS = [1, 2, 3] as const;

export type StudyTrack = (typeof STUDY_TRACKS)[number];
export type StudyYear = (typeof STUDY_YEARS)[number];
export type AccessType = "free_test" | "paid";

export type StudyOption = {
  track: StudyTrack;
  year: StudyYear;
  label: string;
  isFreeTest: boolean;
};

export const STUDY_OPTIONS: StudyOption[] = [
  { track: "stomatologia", year: 1, label: "Stomatologia · rok 1", isFreeTest: false },
  { track: "stomatologia", year: 2, label: "Stomatologia · rok 2", isFreeTest: true },
  { track: "stomatologia", year: 3, label: "Stomatologia · rok 3", isFreeTest: false },
  { track: "lekarski", year: 1, label: "Lekarski · rok 1", isFreeTest: false },
  { track: "lekarski", year: 3, label: "Lekarski · rok 3", isFreeTest: false },
];

export const trackSchema = z.enum(STUDY_TRACKS);
export const yearSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const selectionSchema = z.object({
  track: trackSchema,
  year: z.coerce.number().pipe(yearSchema),
});

export function normalizeTrack(track: string | null | undefined): StudyTrack {
  return track === "lekarski" ? "lekarski" : "stomatologia";
}

export function normalizeYear(year: number | null | undefined): StudyYear {
  if (year === 2 || year === 3) return year;
  return 1;
}

export function isFreeTestSelection(track: StudyTrack, year: StudyYear): boolean {
  return track === "stomatologia" && year === 2;
}

/** Nowe rejestracje i checkout Stripe — zamknięte dla tych opcji. */
export const CLOSED_REGISTRATION_OPTIONS = new Set<string>([optionKey("lekarski", 2)]);

export function isRegistrationClosedForSelection(track: StudyTrack, year: StudyYear): boolean {
  return CLOSED_REGISTRATION_OPTIONS.has(optionKey(track, year));
}

export function formatTrackLabel(track: StudyTrack): string {
  return track === "lekarski" ? "Lekarski" : "Stomatologia";
}

export function optionKey(track: StudyTrack, year: StudyYear): string {
  return `${track}:${year}`;
}
