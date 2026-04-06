import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Jedno zapytanie `profiles` na żądanie (deduplikacja z cache() między layoutem a loaderami). */
export const getProfileByUserId = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
});
