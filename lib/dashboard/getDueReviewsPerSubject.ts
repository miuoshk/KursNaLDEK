import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnnpCatalogRows } from "@/features/shared/server/knnpCatalogCache";
import { getSubjectScopeIds } from "@/features/session/server/sharedSubjects";

/**
 * Liczba pytań due (next_review <= teraz) per przedmiot kanoniczny,
 * z agregacją peerów ze scope (np. anatomia native + peer).
 */
export async function getDueReviewsPerSubject(
  supabase: SupabaseClient,
  userId: string,
  catalog: KnnpCatalogRows,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const topicIds = catalog.topicRows.map((t) => t.id);
  if (topicIds.length === 0) return out;

  const topicToSubject = new Map<string, string>();
  for (const t of catalog.topicRows) {
    topicToSubject.set(t.id, t.subject_id);
  }

  const { data: qRows } = await supabase
    .from("questions")
    .select("id, topic_id")
    .in("topic_id", topicIds)
    .eq("is_active", true);

  const questionIds = (qRows ?? []).map((q) => q.id as string);
  if (questionIds.length === 0) return out;

  const nowIso = new Date().toISOString();
  const { data: dueRows, error } = await supabase
    .from("user_question_progress")
    .select("question_id")
    .eq("user_id", userId)
    .not("next_review", "is", null)
    .lte("next_review", nowIso)
    .in("question_id", questionIds);

  if (error) {
    console.error("[getDueReviewsPerSubject]", error.message);
    return out;
  }

  const nativeCount = new Map<string, number>();
  for (const row of dueRows ?? []) {
    const qid = row.question_id as string;
    const topicId = (qRows ?? []).find((q) => q.id === qid)?.topic_id as
      | string
      | undefined;
    if (!topicId) continue;
    const sid = topicToSubject.get(topicId);
    if (!sid) continue;
    nativeCount.set(sid, (nativeCount.get(sid) ?? 0) + 1);
  }

  for (const subjectRow of catalog.subjectRows) {
    const canonicalId = subjectRow.id as string;
    let sum = 0;
    for (const peerId of getSubjectScopeIds(canonicalId)) {
      sum += nativeCount.get(peerId) ?? 0;
    }
    if (sum > 0) out.set(canonicalId, sum);
  }

  return out;
}
