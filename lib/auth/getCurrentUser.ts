import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Zwraca zalogowanego użytkownika, deduplikując walidację tokenu w obrębie
 * jednego żądania (React `cache()`). Layout, guardy i loadery stron wołały
 * `supabase.auth.getUser()` niezależnie — każde to round-trip do Supabase Auth.
 * Tu walidacja leci raz, a wynik jest współdzielony.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
