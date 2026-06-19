import "server-only";

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mergeSubjectPopularityByShortName,
  type AdminSubjectPopularityMerged,
} from "@/features/admin/server/mergeSubjectPopularity";
import type { AdminTrendRange, AdminTrendTrack } from "@/features/admin/server/loadAdminTrendSeries";

export type AdminCohortSubjectSeries = {
  track: AdminTrendTrack;
  year: "all" | number;
  range: AdminTrendRange;
  totalSessions: number;
  subjects: AdminSubjectPopularityMerged[];
};

type CohortRpcRow = { subjectId: string; sessions: number; questions: number; accSum: number };
type CohortRpcResult = { totalSessions: number; subjects: CohortRpcRow[] };

const loadCohortUncached = async (
  track: AdminTrendTrack,
  year: "all" | number,
  range: AdminTrendRange,
): Promise<AdminCohortSubjectSeries> => {
  const admin = createAdminClient();

  const [aggRes, subjectsRes] = await Promise.all([
    admin.rpc("admin_cohort_subject_popularity", {
      p_track: track,
      p_year: year === "all" ? null : year,
      p_range: Number(range),
    }),
    admin.from("subjects").select("id, name, short_name, track, year"),
  ]);

  if (aggRes.error || !aggRes.data) {
    if (aggRes.error) console.error("[loadAdminCohortSubjectPopularity]", aggRes.error.message);
    return { track, year, range, totalSessions: 0, subjects: [] };
  }

  const agg = aggRes.data as unknown as CohortRpcResult;

  const subjectMeta = new Map<
    string,
    { name: string; shortName: string; track: string | null; year: number | null }
  >();
  for (const s of subjectsRes.data ?? []) {
    subjectMeta.set(s.id as string, {
      name: (s.name as string) ?? (s.id as string),
      shortName: ((s.short_name as string | null) ?? (s.name as string) ?? (s.id as string)).trim(),
      track: (s.track as string | null) ?? null,
      year: (s.year as number | null) ?? null,
    });
  }

  const raw = (agg.subjects ?? []).map((row) => {
    const meta = subjectMeta.get(row.subjectId);
    return {
      subjectId: row.subjectId,
      subjectName: meta?.name ?? row.subjectId,
      shortName: meta?.shortName ?? row.subjectId,
      track: meta?.track ?? null,
      year: meta?.year ?? null,
      sessions: Number(row.sessions ?? 0),
      questions: Number(row.questions ?? 0),
      accSum: Number(row.accSum ?? 0),
    };
  });

  return {
    track,
    year,
    range,
    totalSessions: Number(agg.totalSessions ?? 0),
    subjects: mergeSubjectPopularityByShortName(raw, 12),
  };
};

const getCachedCohort = unstable_cache(loadCohortUncached, ["admin-cohort-subjects"], {
  revalidate: 60,
});

export async function loadAdminCohortSubjectPopularity(params: {
  track?: AdminTrendTrack;
  year?: "all" | number;
  range?: AdminTrendRange;
}): Promise<AdminCohortSubjectSeries> {
  const track = params.track ?? "all";
  const year = params.year ?? "all";
  const range = params.range ?? "30";
  return getCachedCohort(track, year, range);
}
