import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CONSUMER_CONSENT_ACCESS_DAYS,
  CONSUMER_WITHDRAWAL_WAIVER_TEXT,
} from "@/features/checkout/constants/consentText";

export async function logConsumerConsent(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase.from("consent_log").insert({
    user_id: userId,
    consent_text: CONSUMER_WITHDRAWAL_WAIVER_TEXT,
    accepted_at: new Date().toISOString(),
    access_days: CONSUMER_CONSENT_ACCESS_DAYS,
  });

  if (error) {
    console.error("[logConsumerConsent]", error.message);
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
