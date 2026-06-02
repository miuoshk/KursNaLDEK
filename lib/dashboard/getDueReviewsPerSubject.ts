import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeTrack, type StudyTrack } from "@/features/access/lib/studyAccess";
import { fetchActiveQuestionsForTopics } from "@/lib/content/fetchActiveQuestionsForTopics";
import type { KnnpCatalogRows } from "@/features/shared/server/knnpCatalogCache";
import { getTrackShellsForContentSubject } from "@/features/session/server/sharedSubjects";

/**
 * Liczba pytań due (next_review <= teraz) per przedmiot kanoniczny,
 * z agregacją peerów ze scope (np. anatomia native + peer).
 */
export async function getDueReviewsPerSubject(
  supabase: SupabaseClient,
  userId: string,
  catalog: KnnpCatalogRows,
  track: string,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const topicIds = catalog.topicRows.map((t) => t.id);
  if (topicIds.length === 0) return out;

  const topicToSubject = new Map<string, string>();
  for (const t of catalog.topicRows) {
    topicToSubject.set(t.id, t.subject_id);
  }

  const studyTrack = normalizeTrack(track) as StudyTrack;
  const qRows = await fetchActiveQuestionsForTopics(
    supabase,
    topicIds,
    studyTrack,
  );

  const questionIds = qRows.map((q) => q.id);
  if (questionIds.length === 0) return out;

  const nowIso = new Date().toISOString();
  const dueRows: { question_id: string }[] = [];
  const IN_CHUNK = 200;
  for (let i = 0; i < questionIds.length; i += IN_CHUNK) {
    const chunk = questionIds.slice(i, i + IN_CHUNK);
    const { data, error } = await supabase
      .from("user_question_progress")
      .select("question_id")
      .eq("user_id", userId)
      .not("next_review", "is", null)
      .lte("next_review", nowIso)
      .in("question_id", chunk);

    if (error) {
      console.error("[getDueReviewsPerSubject]", error.message);
      return out;
    }
    dueRows.push(...((data ?? []) as typeof dueRows));
  }

  const shellDueCount = new Map<string, number>();
  for (const row of dueRows ?? []) {
    const qid = row.question_id as string;
    const topicId = qRows.find((q) => q.id === qid)?.topic_id;
    if (!topicId) continue;
    const contentSubjectId = topicToSubject.get(topicId);
    if (!contentSubjectId) continue;
    for (const shellId of getTrackShellsForContentSubject(contentSubjectId)) {
      shellDueCount.set(shellId, (shellDueCount.get(shellId) ?? 0) + 1);
    }
  }

  for (const subjectRow of catalog.subjectRows) {
    const shellId = subjectRow.id as string;
    const sum = shellDueCount.get(shellId) ?? 0;
    if (sum > 0) out.set(shellId, sum);
  }

  return out;
}
