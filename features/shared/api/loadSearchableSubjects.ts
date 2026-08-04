"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { getCachedProductCatalog } from "@/features/shared/server/knnpCatalogCache";
import { isClinicalProduct, normalizeProduct, normalizeTrack } from "@/features/access/lib/studyAccess";
import { requireLearningAccessForProfile } from "@/features/access/server/requireLearningAccess";

export type SearchSubjectItem = {
  id: string;
  name: string;
  shortName: string;
  year: number;
  track: string;
};

/**
 * Lekka lista przedmiotow uzytkownika dla command palette / wyszukiwarki.
 * Wraca jedynie podzbior pol potrzebnych do nawigacji (id + nazwa + meta),
 * bez agregowania pytan czy postepu. Filtrujemy do (track, year) profilu,
 * zeby palette nie ujawniala materialu spoza dostepow uzytkownika.
 *
 * Zwracamy `[]` w trybie testowym / dla niezalogowanego usera, aby palette
 * dzialala bez bledow nawigacyjnych.
 */
export async function loadSearchableSubjects(): Promise<SearchSubjectItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const access = await requireLearningAccessForProfile(user.id);
  if (!access.ok) return [];

  const profile = await getProfileByUserId(user.id);
  const track = normalizeTrack(profile?.current_track ?? "stomatologia");
  const product = normalizeProduct(profile?.current_product);
  const year = isClinicalProduct(product) ? 1 : (profile?.current_year ?? 1);

  const { subjectRows } = await getCachedProductCatalog(product, track, year);
  return subjectRows.map((s) => ({
    id: s.id,
    name: s.name,
    shortName: s.short_name,
    year: s.year,
    track: s.track,
  }));
}
