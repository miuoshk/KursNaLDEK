import type { SupabaseClient } from "@supabase/supabase-js";
import type { SourceFilter } from "@/features/session/types";
import {
  applySourceFilterToQuestionQuery,
  resolveEngineSourceFilter,
} from "@/features/session/lib/sourceFilter";

const CHUNK = 200;

/**
 * Zawęża pulę ID do source = own albo source IN referenceSources(product).
 * Produkt bez źródeł referencyjnych i filtr `all` zwracają `ids` bez zapytania.
 */
export async function restrictQuestionIdsBySource(
  supabase: SupabaseClient,
  ids: string[],
  source: SourceFilter,
  product: string | null | undefined,
): Promise<string[]> {
  const resolved = resolveEngineSourceFilter(source, product);
  if (ids.length === 0 || resolved === "all" || !product) {
    return ids;
  }

  const allowed = new Set<string>();
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const query = applySourceFilterToQuestionQuery(
      supabase.from("questions").select("id").in("id", chunk).eq("is_active", true),
      resolved,
      product,
    );
    const { data, error } = await query;
    if (error) {
      console.error("[restrictQuestionIdsBySource]", error.message);
      break;
    }
    for (const row of data ?? []) {
      allowed.add(row.id as string);
    }
  }
  return ids.filter((id) => allowed.has(id));
}
