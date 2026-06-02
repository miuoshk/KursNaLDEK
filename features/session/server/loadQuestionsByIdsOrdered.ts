import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudyTrack } from "@/features/access/lib/studyAccess";
import { questionTracksOrFilter } from "@/lib/content/topicTrackVisibility";
import {
  mapRowToSessionQuestion,
  type QuestionRow,
} from "@/features/session/lib/mapSessionQuestion";

export async function loadQuestionsByIdsOrdered(
  supabase: SupabaseClient,
  ids: string[],
  track?: StudyTrack,
): Promise<QuestionRow[]> {
  if (ids.length === 0) return [];
  let query = supabase
    .from("questions")
    .select(
      "id, topic_id, text, options, correct_option_id, explanation, source_code, image_url, disable_option_shuffle, topics ( name )",
    )
    .in("id", ids)
    .eq("is_active", true);
  if (track) {
    query = query.or(questionTracksOrFilter(track));
  }
  const { data, error } = await query;

  if (error) {
    console.error("[loadQuestionsByIdsOrdered]", error.message);
    return [];
  }

  const byId = new Map((data ?? []).map((r) => [r.id as string, r as QuestionRow]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as QuestionRow[];
}

export function mapRowsToSessionQuestions(rows: QuestionRow[]) {
  return rows.map(mapRowToSessionQuestion);
}
