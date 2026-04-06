"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type PasswordResetResult =
  | { ok: true }
  | { ok: false; message: string };

export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  if (!email?.includes("@")) {
    return { ok: false, message: "Nieprawidłowy adres e-mail." };
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
    return { ok: false, message: "Nie udało się wysłać wiadomości. Spróbuj ponownie." };
  }
  return { ok: true };
}
