import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSubjectScopeIds } from "@/features/session/server/sharedSubjects";

export type KnnpCatalogRows = {
  subjectRows: {
    id: string;
    name: string;
    short_name: string;
    icon_name: string | null;
    year: number;
    track: string;
    product: string;
    display_order: number | null;
  }[];
  topicRows: { id: string; subject_id: string; question_count: number | null }[];
};

/**
 * Katalog przedmiotów/tematów knnp — deduplikacja w obrębie żądania (React cache).
 * Nie używamy unstable_cache + createClient (cookies), bo to powoduje błędy SSR w Next.js.
 */
export const getCachedKnnpCatalog = cache(async (track?: string, year?: number): Promise<KnnpCatalogRows> => {
  const supabase = await createClient();
  let query = supabase
    .from("subjects")
    .select(
      "id, name, short_name, icon_name, year, track, product, display_order",
    )
    .eq("product", "knnp");
  if (track) {
    query = query.eq("track", track);
  }
  if (year != null) {
    query = query.eq("year", year);
  }
  const { data: subjectRows, error: se } = await query
    .order("display_order", { ascending: true });
  if (se) {
    console.error("[getCachedKnnpCatalog] subjects:", se.message);
    return { subjectRows: [], topicRows: [] };
  }
  const ids = (subjectRows ?? []).map((s) => s.id);
  if (ids.length === 0) return { subjectRows: [], topicRows: [] };
  // Dla subjectów współdzielonych między kierunkami (np. anatomia) dociągamy
  // też topiki peer-subjectu, żeby agregaty (liczba pytań) były pełne.
  const topicSubjectIds = new Set<string>(ids);
  for (const sid of ids) {
    for (const peer of getSubjectScopeIds(sid)) topicSubjectIds.add(peer);
  }
  const { data: topicRows, error: te } = await supabase
    .from("topics")
    .select("id, subject_id, question_count")
    .in("subject_id", Array.from(topicSubjectIds));
  if (te) {
    console.error("[getCachedKnnpCatalog] topics:", te.message);
    return { subjectRows: subjectRows as KnnpCatalogRows["subjectRows"], topicRows: [] };
  }
  return {
    subjectRows: subjectRows as KnnpCatalogRows["subjectRows"],
    topicRows: topicRows ?? [],
  };
});
