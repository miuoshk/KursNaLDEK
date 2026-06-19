import "server-only";

import type { AdminUserSegment, TrackKey } from "@/features/admin/server/loadAdminDashboard";
import {
  getDashboardSessionAggregates,
  getProfilesForSegments,
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
  const [agg, profiles] = await Promise.all([
    getDashboardSessionAggregates(),
    getProfilesForSegments(),
  ]);

  const activeUsersSet7d = new Set<string>();
  const activeUsersSet30d = new Set<string>();
  const userCompletedTests30d = new Map<string, number>();

  for (const u of agg.perUser) {
    if (u.sessions30 > 0) activeUsersSet30d.add(u.userId);
    if (u.sessions7 > 0) activeUsersSet7d.add(u.userId);
    if (u.completedTests30 > 0) {
      userCompletedTests30d.set(u.userId, u.completedTests30);
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
