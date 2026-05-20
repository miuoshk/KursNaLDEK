import type { SupabaseClient } from "@supabase/supabase-js";
import { getSubjectScopeIds } from "@/features/session/server/sharedSubjects";

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
): Promise<string[]> {
  const subjectScopeIds = getSubjectScopeIds(subjectId);
  const { data: topicRows, error: te } = await supabase
    .from("topics")
    .select("id")
    .in("subject_id", subjectScopeIds);

  if (te) {
    console.error("[fetchSubjectQuestionIds] topics", te.message);
    return [];
  }

  const topicIds = (topicRows ?? []).map((t) => t.id);
  if (topicIds.length === 0) return [];

  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .in("topic_id", topicIds)
    .eq("is_active", true);

  if (error) {
    console.error("[fetchSubjectQuestionIds] questions", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.id as string);
}

export async function fetchTopicQuestionIds(
  supabase: SupabaseClient,
  topicId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .eq("topic_id", topicId)
    .eq("is_active", true);

  if (error) {
    console.error("[fetchTopicQuestionIds]", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.id as string);
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
  return (data ?? []).map((s) => s.id as string);
}

/** Wszystkie aktywne pytania z przedmiotów product=knnp (sesja mieszana). */
export async function fetchKnnpAllQuestionIds(
  supabase: SupabaseClient,
  track?: string,
  year?: number,
): Promise<string[]> {
  const subjectIds = await fetchScopedKnnpSubjectIds(supabase, track, year);
  if (subjectIds.length === 0) return [];
  const { data: topicRows, error: te } = await supabase
    .from("topics")
    .select("id")
    .in("subject_id", subjectIds);
  if (te) {
    console.error("[fetchKnnpAllQuestionIds] topics", te.message);
    return [];
  }
  const topicIds = (topicRows ?? []).map((t) => t.id as string);
  if (topicIds.length === 0) return [];
  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .in("topic_id", topicIds)
    .eq("is_active", true);
  if (error) {
    console.error("[fetchKnnpAllQuestionIds] questions", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.id as string);
}

export async function fetchKnnpTopicIdSet(
  supabase: SupabaseClient,
  track?: string,
  year?: number,
): Promise<Set<string>> {
  const subjectIds = await fetchScopedKnnpSubjectIds(supabase, track, year);
  if (subjectIds.length === 0) return new Set();
  const { data: topicRows } = await supabase
    .from("topics")
    .select("id")
    .in("subject_id", subjectIds);
  return new Set((topicRows ?? []).map((t) => t.id as string));
}
