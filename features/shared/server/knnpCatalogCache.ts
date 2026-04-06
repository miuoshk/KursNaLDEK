import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  topicRows: { subject_id: string; question_count: number | null }[];
};

/** Katalog przedmiotów/tematów knnp — zmienia się rzadko; cache 1 h. */
export const getCachedKnnpCatalog = unstable_cache(
  async (): Promise<KnnpCatalogRows> => {
    const supabase = await createClient();
    const { data: subjectRows, error: se } = await supabase
      .from("subjects")
      .select(
        "id, name, short_name, icon_name, year, track, product, display_order",
      )
      .eq("product", "knnp")
      .order("display_order", { ascending: true });
    if (se) {
      console.error("[getCachedKnnpCatalog] subjects:", se.message);
      return { subjectRows: [], topicRows: [] };
    }
    const ids = (subjectRows ?? []).map((s) => s.id);
    if (ids.length === 0) return { subjectRows: [], topicRows: [] };
    const { data: topicRows, error: te } = await supabase
      .from("topics")
      .select("subject_id, question_count")
      .in("subject_id", ids);
    if (te) {
      console.error("[getCachedKnnpCatalog] topics:", te.message);
      return { subjectRows: subjectRows as KnnpCatalogRows["subjectRows"], topicRows: [] };
    }
    return {
      subjectRows: subjectRows as KnnpCatalogRows["subjectRows"],
      topicRows: topicRows ?? [],
    };
  },
  ["knnp-catalog-v1"],
  { revalidate: 3600 },
);
