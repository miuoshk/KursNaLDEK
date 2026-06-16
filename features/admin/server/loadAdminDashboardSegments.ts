import "server-only";

import type { AdminUserSegment, TrackKey } from "@/features/admin/server/loadAdminDashboard";
import {
  getProfilesForSegments,
  getStudySessionsLast30d,
} from "@/features/admin/server/loadAdminShared";

const YEAR_COHORT_CAPACITY: Record<Exclude<TrackKey, "inny">, number> = {
  lekarski: 288,
  stomatologia: 120,
};

const TRACK_LABEL: Record<TrackKey, string> = {
  lekarski: "Lekarski",
  stomatologia: "Stomatologia",
  inny: "Inny",
};

function normalizeTrack(value: unknown): TrackKey {
  if (value === "lekarski" || value === "stomatologia") return value;
  return "inny";
}

function trackYearLabel(track: TrackKey, year: number | null): string {
  const trackShort =
    track === "lekarski" ? "LEK" : track === "stomatologia" ? "STOMA" : "—";
  return year ? `${year} ${trackShort}` : trackShort;
}

/** Segmenty użytkowników (kierunek × rok) — lekki loader na pierwszy ekran. */
export async function loadAdminDashboardSegments(): Promise<AdminUserSegment[]> {
  const now = new Date();
  const since7dMs = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();

  const [sessions30d, profiles] = await Promise.all([
    getStudySessionsLast30d(),
    getProfilesForSegments(),
  ]);

  const activeUsersSet7d = new Set<string>();
  const activeUsersSet30d = new Set<string>();
  const userCompletedTests30d = new Map<string, number>();

  for (const row of sessions30d) {
    if (!row.user_id) continue;
    activeUsersSet30d.add(row.user_id);
    if (row.started_at && new Date(row.started_at).getTime() >= since7dMs) {
      activeUsersSet7d.add(row.user_id);
    }
    if (row.is_completed === true || row.completed_at !== null) {
      userCompletedTests30d.set(
        row.user_id,
        (userCompletedTests30d.get(row.user_id) ?? 0) + 1,
      );
    }
  }

  const segmentBuckets = new Map<
    string,
    AdminUserSegment & {
      activeIds7: Set<string>;
      activeIds30: Set<string>;
      completedTestsSum: number;
    }
  >();

  for (const profile of profiles) {
    const uid = profile.id;
    const track = normalizeTrack(profile.current_track);
    const year = profile.current_year ?? null;
    const key = `${track}|${year ?? "-"}`;
    const bucket = segmentBuckets.get(key) ?? {
      track,
      year,
      label: trackYearLabel(track, year),
      count: 0,
      pctOfYearCapacity: null,
      activeLast7d: 0,
      activeLast30d: 0,
      avgCompletedTestsPerUser: 0,
      activeIds7: new Set<string>(),
      activeIds30: new Set<string>(),
      completedTestsSum: 0,
    };
    bucket.count += 1;
    bucket.completedTestsSum += userCompletedTests30d.get(uid) ?? 0;
    if (activeUsersSet7d.has(uid)) bucket.activeIds7.add(uid);
    if (activeUsersSet30d.has(uid)) bucket.activeIds30.add(uid);
    segmentBuckets.set(key, bucket);
  }

  return Array.from(segmentBuckets.values())
    .map((b) => {
      const capacity =
        b.track === "lekarski" || b.track === "stomatologia"
          ? YEAR_COHORT_CAPACITY[b.track]
          : null;
      const pctOfYearCapacity =
        capacity && b.year != null
          ? Number(((b.count / capacity) * 100).toFixed(1))
          : null;
      return {
        track: b.track,
        year: b.year,
        label: b.label,
        count: b.count,
        pctOfYearCapacity,
        activeLast7d: b.activeIds7.size,
        activeLast30d: b.activeIds30.size,
        avgCompletedTestsPerUser:
          b.count > 0
            ? Number((b.completedTestsSum / b.count).toFixed(1))
            : 0,
      };
    })
    .sort((a, b) => {
      if (a.track !== b.track) {
        return TRACK_LABEL[a.track].localeCompare(TRACK_LABEL[b.track]);
      }
      return (a.year ?? 99) - (b.year ?? 99);
    });
}
