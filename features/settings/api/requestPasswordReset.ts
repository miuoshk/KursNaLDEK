"use server";

import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type PasswordResetResult =
  | { ok: true }
  | { ok: false; message: string };

export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  const tSettings = await getTranslations("settings");
  const tErrors = await getTranslations("errors");
  if (!email?.includes("@")) {
    return { ok: false, message: tErrors("invalidEmail") };
  }
  const supabase = await createClient();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/login`,
  });

  if (error) {
    return { ok: false, message: tSettings("errors.passwordResetSendFailed") };
  }
  return { ok: true };
}
