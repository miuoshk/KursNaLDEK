"use server";

import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAppLocale, LOCALE_COOKIE, type AppLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

const localeSchema = z.object({
  locale: z
    .string()
    .refine((value): value is AppLocale => isAppLocale(value), {
      message: "invalidLocale",
    }),
});

export type UpdateLocaleResult =
  | { ok: true; locale: AppLocale }
  | { ok: false; error: string };

export async function updateLocale(formData: FormData): Promise<UpdateLocaleResult> {
  const tSettings = await getTranslations("settings");
  const tErrors = await getTranslations("errors");
  const parsed = localeSchema.safeParse({
    locale: formData.get("locale"),
  });

  if (!parsed.success) {
    return { ok: false, error: tSettings("invalidLocale") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: tErrors("noSession") };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ locale: parsed.data.locale })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: tErrors("saveFailed") };
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, parsed.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { ok: true, locale: parsed.data.locale };
}
