import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudyTrack } from "@/features/access/lib/studyAccess";
import { filterTopicsForTrack } from "@/lib/content/topicTrackVisibility";
import { fetchActiveQuestionsForTopics } from "@/lib/content/fetchActiveQuestionsForTopics";
import {
  expandTopicSubjectIdsForCatalog,
  getSubjectScopeIds,
} from "@/features/session/server/sharedSubjects";

export async function fetchVisibleTopicIds(
  supabase: SupabaseClient,
  subjectScopeIds: string[],
  track?: StudyTrack,
): Promise<string[]> {
  const { data: topicRows, error: te } = await supabase
    .from("topics")
    .select("id, tracks")
    .in("subject_id", subjectScopeIds);

  if (te) {
    console.error("[fetchVisibleTopicIds] topics", te.message);
    return [];
  }

  const visible = track
    ? filterTopicsForTrack(topicRows ?? [], track)
    : (topicRows ?? []);
  return visible.map((t) => t.id as string);
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function fetchSubjectQuestionIds(
  supabase: SupabaseClient,
  subjectId: string,
  track?: StudyTrack,
): Promise<string[]> {
  const subjectScopeIds = getSubjectScopeIds(subjectId);
  const topicIds = await fetchVisibleTopicIds(supabase, subjectScopeIds, track);
  if (topicIds.length === 0) return [];

  const rows = await fetchActiveQuestionsForTopics(supabase, topicIds, track);
  return rows.map((r) => r.id);
}

export async function fetchTopicQuestionIds(
  supabase: SupabaseClient,
  topicId: string,
  track: StudyTrack,
): Promise<string[]> {
  const rows = await fetchActiveQuestionsForTopics(supabase, [topicId], track);
  return rows.map((r) => r.id);
}

/**
 * Subject IDs z `product=knnp` zawężone do bieżącego (track, year) usera —
 * sesja mieszana / powtórka bez wskazania przedmiotu nie ma prawa złapać
 * pytań z roku/kierunku, do którego user obecnie nie ma dostępu.
 *
 * Gdy `track`/`year` nie zostaną podane, fallback do wszystkich KNNP
 * (zachowuje wsteczną kompatybilność dla starego kodu i testów).
 */
async function fetchScopedKnnpSubjectIds(
  supabase: SupabaseClient,
  track?: string,
  year?: number,
): Promise<string[]> {
  let query = supabase.from("subjects").select("id").eq("product", "knnp");
  if (track) query = query.eq("track", track);
  if (year != null) query = query.eq("year", year);
  const { data, error } = await query;
  if (error) {
    console.error("[fetchScopedKnnpSubjectIds]", error.message);
    return [];
  }
  const shellIds = (data ?? []).map((s) => s.id as string);
  return expandTopicSubjectIdsForCatalog(shellIds);
}

/** Wszystkie aktywne pytania z przedmiotów product=knnp (sesja mieszana). */
export async function fetchKnnpAllQuestionIds(
  supabase: SupabaseClient,
  track?: string,
  year?: number,
): Promise<string[]> {
  const subjectIds = await fetchScopedKnnpSubjectIds(supabase, track, year);
  if (subjectIds.length === 0) return [];
  const studyTrack = track as StudyTrack | undefined;
  const topicIds = await fetchVisibleTopicIds(supabase, subjectIds, studyTrack);
  if (topicIds.length === 0) return [];
  const rows = await fetchActiveQuestionsForTopics(
    supabase,
    topicIds,
    studyTrack,
  );
  return rows.map((r) => r.id);
}

export async function fetchKnnpTopicIdSet(
  supabase: SupabaseClient,
  track?: string,
  year?: number,
): Promise<Set<string>> {
  const subjectIds = await fetchScopedKnnpSubjectIds(supabase, track, year);
  if (subjectIds.length === 0) return new Set();
  const studyTrack = track as StudyTrack | undefined;
  const topicIds = await fetchVisibleTopicIds(supabase, subjectIds, studyTrack);
  return new Set(topicIds);
}
