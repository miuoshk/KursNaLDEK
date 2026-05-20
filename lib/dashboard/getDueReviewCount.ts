import type { SupabaseClient } from "@supabase/supabase-js";
import { getCachedKnnpCatalog } from "@/features/shared/server/knnpCatalogCache";

/**
 * Pytania z zaplanowaną powtórką (next_review <= teraz), zawężone do
 * curriculum bieżącego (track, year). Bez tego zawężenia studenci, którzy
 * zmienili rok/kierunek (lub korzystali z free testu), widzieli powtórki
 * z przedmiotów, do których już nie mają dostępu.
 *
 * Gdy `track`/`year` nie zostaną podane, zwracana jest globalna liczba
 * (legacy fallback — np. dla skryptów / testów).
 */
export async function getDueReviewCount(
  supabase: SupabaseClient,
  userId: string,
  track?: string,
  year?: number,
): Promise<number> {
  const nowIso = new Date().toISOString();

  if (!track || year == null) {
    const { count, error } = await supabase
      .from("user_question_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("next_review", "is", null)
      .lte("next_review", nowIso);
    if (error) {
      console.error("[getDueReviewCount]", error.message);
      return 0;
    }
    return count ?? 0;
  }

  const catalog = await getCachedKnnpCatalog(track, year);
  const topicIds = catalog.topicRows.map((t) => t.id);
  if (topicIds.length === 0) return 0;

  const { data: qRows } = await supabase
    .from("questions")
    .select("id")
    .in("topic_id", topicIds)
    .eq("is_active", true);
  const questionIds = (qRows ?? []).map((q) => q.id as string);
  if (questionIds.length === 0) return 0;

  const { count, error } = await supabase
    .from("user_question_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("next_review", "is", null)
    .lte("next_review", nowIso)
    .in("question_id", questionIds);

  if (error) {
    console.error("[getDueReviewCount]", error.message);
    return 0;
  }
  return count ?? 0;
}
