import type { SupabaseClient } from "@supabase/supabase-js";
import { getCachedProductCatalog } from "@/features/shared/server/knnpCatalogCache";
import {
  isClinicalProduct,
  normalizeProduct,
  normalizeTrack,
} from "@/features/access/lib/studyAccess";
import { MEMORY_SCHEDULER_VERSION } from "@/features/session/lib/memory/scheduler";

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
  product?: string | null,
  engineVariant: "shadow" | "treatment" = "shadow",
): Promise<number> {
  if (!track || year == null) {
    const nowIso = new Date().toISOString();
    const table =
      engineVariant === "treatment"
        ? "user_question_memory_v2"
        : "user_question_progress";
    let query = supabase
      .from(table)
      .select(engineVariant === "treatment" ? "question_id" : "id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId)
      .neq("state", "new")
      .not("next_review", "is", null)
      .lte("next_review", nowIso);
    if (engineVariant === "treatment") {
      query = query.eq("scheduler_version", MEMORY_SCHEDULER_VERSION);
    }
    const { count, error } = await query;
    if (error) {
      console.error("[getDueReviewCount]", error.message);
      return 0;
    }
    return count ?? 0;
  }

  const normalizedProduct = normalizeProduct(product ?? undefined);
  const catalogYear = isClinicalProduct(normalizedProduct) ? 1 : year;
  const catalog = await getCachedProductCatalog(
    normalizedProduct,
    track,
    catalogYear,
  );
  const topicIds = catalog.topicRows.map((t) => t.id);
  if (topicIds.length === 0) return 0;

  const rpcName =
    engineVariant === "treatment" ? "due_review_count_v2" : "due_review_count";
  const { data, error } = await supabase.rpc(rpcName, {
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
