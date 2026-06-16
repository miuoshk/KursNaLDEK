import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  isAppLocale,
  LOCALE_COOKIE,
  resolveLocaleFromAcceptLanguage,
  type AppLocale,
} from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export async function resolveRequestLocale(): Promise<AppLocale> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("locale")
      .eq("id", user.id)
      .maybeSingle();

    if (isAppLocale(profile?.locale)) {
      return profile.locale;
    }
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isAppLocale(cookieLocale)) {
    return cookieLocale;
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  return resolveLocaleFromAcceptLanguage(acceptLanguage);
}
