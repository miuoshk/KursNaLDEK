import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudyTrack } from "@/features/access/lib/studyAccess";
import { questionTracksOrFilter } from "@/lib/content/topicTrackVisibility";

const PAGE_SIZE = 1000;

export type QuestionTopicRow = { id: string; topic_id: string };

/** Wszystkie aktywne pytania dla podanych topiców (paginacja — domyślny limit PostgREST to 1000). */
export async function fetchActiveQuestionsForTopics(
  supabase: SupabaseClient,
  topicIds: string[],
  track?: StudyTrack,
): Promise<QuestionTopicRow[]> {
  if (topicIds.length === 0) return [];

  const all: QuestionTopicRow[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("questions")
      .select("id, topic_id")
      .in("topic_id", topicIds)
      .eq("is_active", true)
      .range(from, from + PAGE_SIZE - 1);

    if (track) {
      query = query.or(questionTracksOrFilter(track));
    }

    const { data, error } = await query;
    if (error) {
      console.error("[fetchActiveQuestionsForTopics]", error.message);
      break;
    }

    const batch = (data ?? []) as QuestionTopicRow[];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

export function countQuestionsByTopic(rows: QuestionTopicRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.topic_id, (counts.get(row.topic_id) ?? 0) + 1);
  }
  return counts;
}
