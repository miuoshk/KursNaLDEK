import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudyTrack } from "@/features/access/lib/studyAccess";
import { questionTracksOrFilter } from "@/lib/content/topicTrackVisibility";
import {
  mapRowToSessionQuestion,
  type QuestionRow,
} from "@/features/session/lib/mapSessionQuestion";
import { attachCemSessionMeta } from "@/features/session/server/attachCemSessionMeta";

const IN_CHUNK = 200;

export async function loadQuestionsByIdsOrdered(
  supabase: SupabaseClient,
  ids: string[],
  track?: StudyTrack,
  options?: { includeSourceMeta?: boolean },
): Promise<QuestionRow[]> {
  if (ids.length === 0) return [];

  const byId = new Map<string, QuestionRow>();

  for (let offset = 0; offset < ids.length; offset += IN_CHUNK) {
    const slice = ids.slice(offset, offset + IN_CHUNK);
    const base = supabase.from("questions");
    const query = options?.includeSourceMeta
      ? base
          .select(
            "id, topic_id, text, options, correct_option_id, explanation, explanation_blocks, source_code, image_url, disable_option_shuffle, source, repeat_count, first_seen_session, source_exam, question_concepts(concept_id, relation, weight), topics ( name, knowledge_card )",
          )
          .in("id", slice)
          .eq("is_active", true)
      : base
          .select(
            "id, topic_id, text, options, correct_option_id, explanation, explanation_blocks, source_code, image_url, disable_option_shuffle, question_concepts(concept_id, relation, weight), topics ( name, knowledge_card )",
          )
          .in("id", slice)
          .eq("is_active", true);
    const tracked = track ? query.or(questionTracksOrFilter(track)) : query;
    const { data, error } = await tracked;

    if (error) {
      console.error("[loadQuestionsByIdsOrdered]", error.message);
      continue;
    }

    for (const row of data ?? []) {
      byId.set(row.id as string, row as QuestionRow);
    }
  }

  const ordered = ids
    .map((id) => byId.get(id))
    .filter(Boolean) as QuestionRow[];
  if (options?.includeSourceMeta) {
    await attachCemSessionMeta(supabase, ordered);
  }
  return ordered;
}

export function mapRowsToSessionQuestions(rows: QuestionRow[]) {
  return rows.map(mapRowToSessionQuestion);
}
