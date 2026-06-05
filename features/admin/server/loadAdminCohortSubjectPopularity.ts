import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  mergeSubjectPopularityByShortName,
  type AdminSubjectPopularityMerged,
} from "@/features/admin/server/mergeSubjectPopularity";
import type { AdminTrendRange, AdminTrendTrack } from "@/features/admin/server/loadAdminTrendSeries";

const PAGE_SIZE = 1000;
const MS_DAY = 86400000;

type SessionRow = {
  user_id: string | null;
  subject_id: string | null;
  total_questions: number | null;
  correct_answers: number | null;
  accuracy: number | null;
};

function sessionAccuracy(row: SessionRow): number {
  if (typeof row.accuracy === "number") return row.accuracy;
  const totalQ = row.total_questions ?? 0;
  const correctQ = row.correct_answers ?? 0;
  return totalQ > 0 ? correctQ / totalQ : 0;
}

async function resolveUserScope(
  track: AdminTrendTrack,
  year: "all" | number,
): Promise<string[] | null> {
  if (track === "all" && year === "all") return null;
  const admin = createAdminClient();
  let q = admin.from("profiles").select("id");
  if (track !== "all") q = q.eq("current_track", track);
  if (year !== "all") q = q.eq("current_year", year);
  const { data } = await q;
  return (data ?? []).map((row) => row.id as string);
}

async function fetchSessionsSince(
  sinceIso: string,
  userScope: string[] | null,
): Promise<SessionRow[]> {
  const admin = createAdminClient();
  const all: SessionRow[] = [];
  let offset = 0;
  while (true) {
    let q = admin
      .from("study_sessions")
      .select("user_id, subject_id, total_questions, correct_answers, accuracy")
      .gte("started_at", sinceIso);
    if (userScope) q = q.in("user_id", userScope);
    const { data, error } = await q
      .order("started_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      console.error("[loadAdminCohortSubjectPopularity] sessions", error.message);
      break;
    }
    const batch = (data ?? []) as SessionRow[];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

export type AdminCohortSubjectSeries = {
  track: AdminTrendTrack;
  year: "all" | number;
  range: AdminTrendRange;
  totalSessions: number;
  subjects: AdminSubjectPopularityMerged[];
};

export async function loadAdminCohortSubjectPopularity(params: {
  track?: AdminTrendTrack;
  year?: "all" | number;
  range?: AdminTrendRange;
}): Promise<AdminCohortSubjectSeries> {
  const track = params.track ?? "all";
  const year = params.year ?? "all";
  const range = params.range ?? "30";
  const days = Number(range);
  const sinceIso = new Date(Date.now() - days * MS_DAY).toISOString();

  const userScope = await resolveUserScope(track, year);
  if (userScope && userScope.length === 0) {
    return { track, year, range, totalSessions: 0, subjects: [] };
  }

  const [sessions, subjectsRes] = await Promise.all([
    fetchSessionsSince(sinceIso, userScope),
    createAdminClient().from("subjects").select("id, name, short_name, track, year"),
  ]);

  const subjectMeta = new Map<
    string,
    { name: string; shortName: string; track: string | null; year: number | null }
  >();
  for (const s of subjectsRes.data ?? []) {
    subjectMeta.set(s.id as string, {
      name: (s.name as string) ?? (s.id as string),
      shortName: ((s.short_name as string | null) ?? (s.name as string) ?? s.id as string).trim(),
      track: (s.track as string | null) ?? null,
      year: (s.year as number | null) ?? null,
    });
  }

  const bySubject = new Map<
    string,
    { sessions: number; questions: number; accSum: number }
  >();
  for (const row of sessions) {
    if (!row.subject_id) continue;
    const stats = bySubject.get(row.subject_id) ?? {
      sessions: 0,
      questions: 0,
      accSum: 0,
    };
    stats.sessions += 1;
    stats.questions += row.total_questions ?? 0;
    stats.accSum += sessionAccuracy(row);
    bySubject.set(row.subject_id, stats);
  }

  const raw = Array.from(bySubject.entries()).map(([subjectId, stats]) => {
    const meta = subjectMeta.get(subjectId);
    return {
      subjectId,
      subjectName: meta?.name ?? subjectId,
      shortName: meta?.shortName ?? subjectId,
      track: meta?.track ?? null,
      year: meta?.year ?? null,
      sessions: stats.sessions,
      questions: stats.questions,
      accSum: stats.accSum,
    };
  });

  return {
    track,
    year,
    range,
    totalSessions: sessions.length,
    subjects: mergeSubjectPopularityByShortName(raw, 12),
  };
}
