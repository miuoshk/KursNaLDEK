import { enUS, pl, ru, uk } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { AppLocale } from "@/i18n/config";

const DATE_FNS_LOCALES: Record<AppLocale, Locale> = {
  pl,
  uk,
  ru,
  en: enUS,
};

export function getDateFnsLocale(locale: AppLocale): Locale {
  return DATE_FNS_LOCALES[locale] ?? pl;
}
