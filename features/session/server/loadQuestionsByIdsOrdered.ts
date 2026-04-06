import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapRowToSessionQuestion,
  type QuestionRow,
} from "@/features/session/lib/mapSessionQuestion";

export async function loadQuestionsByIdsOrdered(
  supabase: SupabaseClient,
  ids: string[],
): Promise<QuestionRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, text, options, correct_option_id, explanation, difficulty, source_code, topics ( name )",
    )
    .in("id", ids)
    .eq("is_active", true);

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
