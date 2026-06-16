"use server";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountResult =
  | { ok: true; redirect?: never }
  | { ok: false; message: string };

export async function deleteAccount(): Promise<DeleteAccountResult> {
  const tSettings = await getTranslations("settings");
  const tErrors = await getTranslations("errors");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: tErrors("noSession") };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return { ok: false, message: tSettings("errors.deleteAccountFailed") };
    }
  } catch {
    return {
      ok: false,
      message: tSettings("errors.deleteAccountNotConfigured"),
    };
  }

  await supabase.auth.signOut();
  redirect("/login");
}
