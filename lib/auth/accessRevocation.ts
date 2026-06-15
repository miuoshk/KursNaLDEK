import "server-only";

import { createClient } from "@/lib/supabase/server";

export const ACCESS_REVOKED_MESSAGE =
  "Dostęp do platformy został odebrany. Skontaktuj się z administratorem.";

export async function isUserAccessRevoked(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("access_revoked_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[isUserAccessRevoked]", error.message);
    // Fail-closed: brak odczytu profilu = traktuj jak odebrany dostęp.
    return true;
  }

  return Boolean(data?.access_revoked_at);
}
