import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function revokeAllEntitlementsForUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_year_entitlements")
    .update({ active: false })
    .eq("user_id", userId)
    .eq("active", true);

  if (error) {
    throw new Error(error.message);
  }
}
