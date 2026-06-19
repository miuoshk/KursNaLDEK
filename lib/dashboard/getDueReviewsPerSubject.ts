import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeTrack } from "@/features/access/lib/studyAccess";
import type { KnnpCatalogRows } from "@/features/shared/server/knnpCatalogCache";
import { getTrackShellsForContentSubject } from "@/features/session/server/sharedSubjects";

/**
 * Liczba pytań due (next_review <= teraz) per przedmiot kanoniczny,
 * z agregacją peerów ze scope (np. anatomia native + peer).
 *
 * Agregacja po stronie bazy (RPC `topic_progress_stats`): jedno zapytanie
 * zwracające due per topic, zamiast pobierania wszystkich ID pytań do Node
 * i pętli COUNT po 200. Mapowanie topic → przedmiot → powłoki (shells)
 * zostaje w TS na bazie cache'owanego katalogu.
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

  const { data, error } = await supabase.rpc("topic_progress_stats", {
    p_user_id: userId,
    p_topic_ids: topicIds,
    p_track: normalizeTrack(track),
  });

  if (error) {
    console.error("[getDueReviewsPerSubject]", error.message);
    return out;
  }

  const shellDueCount = new Map<string, number>();
  for (const row of (data ?? []) as { topic_id: string; due: number }[]) {
    const due = row.due ?? 0;
    if (due <= 0) continue;
    const contentSubjectId = topicToSubject.get(row.topic_id);
    if (!contentSubjectId) continue;
    for (const shellId of getTrackShellsForContentSubject(contentSubjectId)) {
      shellDueCount.set(shellId, (shellDueCount.get(shellId) ?? 0) + due);
    }
  }

  for (const subjectRow of catalog.subjectRows) {
    const shellId = subjectRow.id as string;
    const sum = shellDueCount.get(shellId) ?? 0;
    if (sum > 0) out.set(shellId, sum);
  }

  return out;
}
