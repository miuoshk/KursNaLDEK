import type { StudyTrack } from "@/features/access/lib/studyAccess";

export type TopicWithTracks = {
  id: string;
  tracks?: string[] | null;
};

/** NULL / pusta tablica = widoczne na obu kierunkach (topics i questions). */
export function isContentVisibleForTrack(
  tracks: string[] | null | undefined,
  track: StudyTrack,
): boolean {
  if (!tracks || tracks.length === 0) return true;
  return tracks.includes(track);
}

export function isTopicVisibleForTrack(
  tracks: string[] | null | undefined,
  track: StudyTrack,
): boolean {
  return isContentVisibleForTrack(tracks, track);
}

export function filterTopicsForTrack<T extends TopicWithTracks>(
  rows: T[],
  track: StudyTrack,
): T[] {
  return rows.filter((row) => isTopicVisibleForTrack(row.tracks, track));
}

/** Filtr PostgREST dla `questions.tracks` (NULL = wspólne, cs = kierunek w tablicy). */
export function questionTracksOrFilter(track: StudyTrack): string {
  return `tracks.is.null,tracks.cs.{${track}}`;
}
