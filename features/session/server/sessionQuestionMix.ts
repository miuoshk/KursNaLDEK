import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchSubjectQuestionIds,
  shuffle,
} from "@/features/session/server/questionSelection";

/** Powtórki należące do tematów z `topicOk`. */
export async function fetchDueReviewQuestionIdsForTopics(
  supabase: SupabaseClient,
  userId: string,
  topicOk: Set<string>,
  limit: number,
  allowedIds?: Set<string>,
): Promise<string[]> {
  if (topicOk.size === 0) return [];

  const { data: dueRows } = await supabase
    .from("user_question_progress")
    .select("question_id, next_review")
    .eq("user_id", userId)
    .not("next_review", "is", null)
    .lte("next_review", new Date().toISOString())
    .order("next_review", { ascending: true });

  if (!dueRows?.length) return [];

  const ids = [...new Set(dueRows.map((r) => r.question_id as string))];
  const { data: qMeta } = await supabase
    .from("questions")
    .select("id, topic_id")
    .in("id", ids);

  const allowed = new Set(
    (qMeta ?? [])
      .filter((q) => topicOk.has(q.topic_id as string))
      .map((q) => q.id as string),
  );

  const out: string[] = [];
  for (const row of dueRows) {
    const qid = row.question_id as string;
    if (allowedIds && !allowedIds.has(qid)) continue;
    if (allowed.has(qid)) out.push(qid);
    if (out.length >= limit) break;
  }
  return out;
}

export async function fetchDueReviewQuestionIds(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
  limit: number,
  allowedIds?: Set<string>,
): Promise<string[]> {
  const { data: topicRows } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", subjectId);
  const topicOk = new Set((topicRows ?? []).map((t) => t.id as string));
  return fetchDueReviewQuestionIdsForTopics(
    supabase,
    userId,
    topicOk,
    limit,
    allowedIds,
  );
}

export async function fetchUnseenQuestionIds(
  supabase: SupabaseClient,
  userId: string,
  pool: string[],
  limit: number,
): Promise<string[]> {
  const poolShuffled = shuffle([...pool]);
  if (poolShuffled.length === 0 || limit === 0) return [];

  const { data: seenRows } = await supabase
    .from("user_question_progress")
    .select("question_id")
    .eq("user_id", userId);

  const seen = new Set((seenRows ?? []).map((r) => r.question_id as string));
  return poolShuffled.filter((id) => !seen.has(id)).slice(0, limit);
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
