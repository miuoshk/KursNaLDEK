import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeTrack } from "@/features/access/lib/studyAccess";
import { getCachedKnnpCatalog } from "@/features/shared/server/knnpCatalogCache";

/**
 * Pytania z zaplanowaną powtórką (next_review <= teraz), zawężone do
 * curriculum bieżącego (track, year). Bez tego zawężenia studenci, którzy
 * zmienili rok/kierunek (lub korzystali z free testu), widzieli powtórki
 * z przedmiotów, do których już nie mają dostępu.
 *
 * Agregacja po stronie bazy (RPC `due_review_count`): jedno zapytanie z JOIN-em
 * zamiast pobierania wszystkich ID pytań do Node i pętli COUNT po 200. Topiki
 * pochodzą z cache'owanego katalogu (ta sama logika co wcześniej), a RPC liczy
 * powtórki dla tego scope w jednym przebiegu.
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
  if (!track || year == null) {
    const nowIso = new Date().toISOString();
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

  const { data, error } = await supabase.rpc("due_review_count", {
    p_user_id: userId,
    p_topic_ids: topicIds,
    p_track: normalizeTrack(track),
  });

  if (error) {
    console.error("[getDueReviewCount]", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}
