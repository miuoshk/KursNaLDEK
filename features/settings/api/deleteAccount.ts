"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountResult =
  | { ok: true; redirect?: never }
  | { ok: false; message: string };

export async function deleteAccount(): Promise<DeleteAccountResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Brak sesji." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return { ok: false, message: "Nie udało się usunąć konta. Skontaktuj się z pomocą." };
    }
  } catch {
    return {
      ok: false,
      message:
        "Usuwanie konta nie jest skonfigurowane (brak klucza serwisowego). Skontaktuj się z administratorem.",
    };
  }

  await supabase.auth.signOut();
  redirect("/login");
}
