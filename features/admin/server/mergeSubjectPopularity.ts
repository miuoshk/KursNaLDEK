import "server-only";

export type SubjectPopularityRaw = {
  subjectId: string;
  subjectName: string;
  shortName: string;
  track: string | null;
  year: number | null;
  sessions: number;
  questions: number;
  accSum: number;
};

export type AdminSubjectPopularityMerged = {
  groupKey: string;
  subjectName: string;
  sessions: number;
  questions: number;
  avgAccuracy: number;
  trackBreakdown: { track: string; sessions: number }[];
};

const TRACK_SHORT: Record<string, string> = {
  lekarski: "LEK",
  stomatologia: "STOMA",
};

export function mergeSubjectPopularityByShortName(
  entries: SubjectPopularityRaw[],
  limit = 10,
): AdminSubjectPopularityMerged[] {
  const groups = new Map<
    string,
    {
      subjectName: string;
      sessions: number;
      questions: number;
      accSum: number;
      trackBreakdown: Map<string, number>;
    }
  >();

  for (const e of entries) {
    const key = e.shortName.trim().toLowerCase();
    if (!key) continue;
    const bucket = groups.get(key) ?? {
      subjectName: e.shortName.trim(),
      sessions: 0,
      questions: 0,
      accSum: 0,
      trackBreakdown: new Map<string, number>(),
    };
    bucket.sessions += e.sessions;
    bucket.questions += e.questions;
    bucket.accSum += e.accSum;
    if (e.track) {
      const trackLabel = TRACK_SHORT[e.track] ?? e.track;
      bucket.trackBreakdown.set(
        trackLabel,
        (bucket.trackBreakdown.get(trackLabel) ?? 0) + e.sessions,
      );
    }
    groups.set(key, bucket);
  }

  return Array.from(groups.entries())
    .map(([groupKey, bucket]) => ({
      groupKey,
      subjectName: bucket.subjectName,
      sessions: bucket.sessions,
      questions: bucket.questions,
      avgAccuracy:
        bucket.sessions > 0
          ? Number(((bucket.accSum / bucket.sessions) * 100).toFixed(1))
          : 0,
      trackBreakdown: Array.from(bucket.trackBreakdown.entries())
        .map(([track, sessions]) => ({ track, sessions }))
        .sort((a, b) => b.sessions - a.sessions),
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);
}
