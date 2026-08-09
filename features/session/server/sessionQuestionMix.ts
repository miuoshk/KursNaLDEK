import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudyTrack } from "@/features/access/lib/studyAccess";
import { fetchActiveQuestionsForTopics } from "@/lib/content/fetchActiveQuestionsForTopics";
import {
  fetchVisibleTopicIds,
  shuffle,
} from "@/features/session/server/questionSelection";
import { getSubjectScopeIds } from "@/features/session/server/sharedSubjects";

const UQP_CHUNK = 200;

/**
 * Fallback: due w obrębie znanej puli ID (chunkowane UQP).
 * Używane gdy RPC niedostępne albo gdy zawężamy do `allowedIds` (sesja tematu).
 */
async function fetchDueFromQuestionPool(
  supabase: SupabaseClient,
  userId: string,
  pool: string[],
  limit: number,
): Promise<string[]> {
  if (pool.length === 0 || limit <= 0) return [];

  const nowIso = new Date().toISOString();
  const due: Array<{ question_id: string; next_review: string }> = [];

  for (let i = 0; i < pool.length; i += UQP_CHUNK) {
    const chunk = pool.slice(i, i + UQP_CHUNK);
    const { data, error } = await supabase
      .from("user_question_progress")
      .select("question_id, next_review")
      .eq("user_id", userId)
      .in("question_id", chunk)
      .not("next_review", "is", null)
      .lte("next_review", nowIso);
    if (error) {
      console.error("[fetchDueFromQuestionPool]", error.message);
      break;
    }
    for (const row of data ?? []) {
      due.push({
        question_id: row.question_id as string,
        next_review: row.next_review as string,
      });
    }
  }

  due.sort(
    (a, b) =>
      new Date(a.next_review).getTime() - new Date(b.next_review).getTime(),
  );
  return due.slice(0, limit).map((r) => r.question_id);
}

/** Powtórki należące do tematów z `topicOk` (scoped jak RPC due_review_count). */
export async function fetchDueReviewQuestionIdsForTopics(
  supabase: SupabaseClient,
  userId: string,
  topicOk: Set<string>,
  track: StudyTrack,
  limit: number,
  allowedIds?: Set<string>,
): Promise<string[]> {
  if (topicOk.size === 0 || limit <= 0) return [];

  // Sesja tematu: filtruj po znanej puli (bez globalnego UQP).
  if (allowedIds && allowedIds.size > 0) {
    return fetchDueFromQuestionPool(
      supabase,
      userId,
      [...allowedIds],
      limit,
    );
  }

  const topicIds = [...topicOk];
  const { data, error } = await supabase.rpc("due_review_question_ids", {
    p_user_id: userId,
    p_topic_ids: topicIds,
    p_track: track,
    p_limit: limit,
  });

  if (!error && Array.isArray(data)) {
    return data
      .map((row) => (row as { question_id: string }).question_id)
      .filter((id): id is string => typeof id === "string");
  }

  if (error) {
    console.error("[fetchDueReviewQuestionIdsForTopics] rpc:", error.message);
  }

  const rows = await fetchActiveQuestionsForTopics(supabase, topicIds, track);
  return fetchDueFromQuestionPool(
    supabase,
    userId,
    rows.map((r) => r.id),
    limit,
  );
}

export async function fetchDueReviewQuestionIds(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
  track: StudyTrack,
  limit: number,
  allowedIds?: Set<string>,
): Promise<string[]> {
  const topicIds = await fetchVisibleTopicIds(
    supabase,
    getSubjectScopeIds(subjectId),
    track,
  );
  const topicOk = new Set(topicIds);
  return fetchDueReviewQuestionIdsForTopics(
    supabase,
    userId,
    topicOk,
    track,
    limit,
    allowedIds,
  );
}

/** Pytania z puli, na które user odpowiedział co najmniej raz (zgodnie z dashboardem). */
export async function fetchAnsweredQuestionIdsInPool(
  supabase: SupabaseClient,
  userId: string,
  pool: string[],
): Promise<Set<string>> {
  const answered = new Set<string>();
  if (pool.length === 0) return answered;

  const CHUNK = 200;
  for (let i = 0; i < pool.length; i += CHUNK) {
    const chunk = pool.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("user_question_progress")
      .select("question_id")
      .eq("user_id", userId)
      .in("question_id", chunk)
      .gt("times_answered", 0);
    if (error) {
      console.error("[fetchAnsweredQuestionIdsInPool]", error.message);
      return answered;
    }
    for (const row of data ?? []) {
      answered.add(row.question_id as string);
    }
  }
  return answered;
}

export async function fetchUnseenQuestionIds(
  supabase: SupabaseClient,
  userId: string,
  pool: string[],
  limit: number,
): Promise<string[]> {
  const poolShuffled = shuffle([...pool]);
  if (poolShuffled.length === 0 || limit === 0) return [];

  const answered = await fetchAnsweredQuestionIdsInPool(supabase, userId, pool);
  return poolShuffled.filter((id) => !answered.has(id)).slice(0, limit);
}

/** Sesja tematu: najpierw nieodpowiedziane, potem powtórki / reszta puli. */
export function mixTopicCompletionQuestionIds(
  unseenIds: string[],
  dueIds: string[],
  pool: string[],
  count: number,
  mode: "inteligentna" | "przeglad",
): string[] {
  const takeUnseen = shuffle(unseenIds).slice(0, Math.min(count, unseenIds.length));
  const chosen = new Set(takeUnseen);
  let out = [...takeUnseen];

  if (out.length < count && mode === "inteligentna") {
    for (const id of dueIds) {
      if (out.length >= count) break;
      if (chosen.has(id)) continue;
      chosen.add(id);
      out.push(id);
    }
  }

  if (out.length < count) {
    const filler = shuffle(pool.filter((id) => !chosen.has(id)));
    out = [...out, ...filler.slice(0, count - out.length)];
  }

  return shuffle(out).slice(0, count);
}

/** Wszystkie pytania z puli mają co najmniej jedną odpowiedź w UQP. */
export async function isPoolFullySeen(
  supabase: SupabaseClient,
  userId: string,
  pool: string[],
): Promise<boolean> {
  if (pool.length === 0) return false;

  const CHUNK = 200;
  let answeredInPool = 0;
  for (let i = 0; i < pool.length; i += CHUNK) {
    const chunk = pool.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("user_question_progress")
      .select("question_id")
      .eq("user_id", userId)
      .in("question_id", chunk)
      .gt("times_answered", 0);
    if (error) {
      console.error("[isPoolFullySeen]", error.message);
      return false;
    }
    answeredInPool += (data ?? []).length;
  }
  return answeredInPool >= pool.length;
}

export function mixNaukaQuestionIds(
  dueIds: string[],
  unseenIds: string[],
  allPool: string[],
  count: number,
): string[] {
  const nDueTarget = Math.round(count * 0.6);
  const takeDue = dueIds.slice(0, Math.min(nDueTarget, dueIds.length));
  let need = count - takeDue.length;
  const takeNew = unseenIds.slice(0, Math.min(need, unseenIds.length));
  let out = [...takeDue, ...takeNew];
  if (out.length < count) {
    need = count - out.length;
    const restDue = dueIds.slice(takeDue.length);
    out = [...out, ...restDue.slice(0, need)];
  }
  if (out.length < count) {
    need = count - out.length;
    const restNew = unseenIds.slice(takeNew.length);
    out = [...out, ...restNew.slice(0, need)];
  }
  if (out.length < count) {
    const chosen = new Set(out);
    const filler = shuffle(allPool.filter((id) => !chosen.has(id)));
    out = [...out, ...filler.slice(0, count - out.length)];
  }
  return shuffle(out).slice(0, count);
}
