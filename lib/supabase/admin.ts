import { createClient } from "@supabase/supabase-js";

/**
 * Klient z uprawnieniami service role — tylko po stronie serwera (np. usuwanie konta).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Brak SUPABASE_SERVICE_ROLE_KEY lub URL Supabase.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
