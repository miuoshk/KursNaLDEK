import type { StudyTrack } from "@/features/access/lib/studyAccess";

export type TopicWithTracks = {
  id: string;
  tracks?: string[] | null;
};

/** NULL / pusta tablica = widoczny na obu kierunkach. */
export function isTopicVisibleForTrack(
  tracks: string[] | null | undefined,
  track: StudyTrack,
): boolean {
  if (!tracks || tracks.length === 0) return true;
  return tracks.includes(track);
}

export function filterTopicsForTrack<T extends TopicWithTracks>(
  rows: T[],
  track: StudyTrack,
): T[] {
  return rows.filter((row) => isTopicVisibleForTrack(row.tracks, track));
}
