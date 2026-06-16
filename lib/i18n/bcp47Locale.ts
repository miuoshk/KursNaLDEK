import type { AppLocale } from "@/i18n/config";

const BCP47_LOCALE: Record<AppLocale, string> = {
  pl: "pl-PL",
  uk: "uk-UA",
  ru: "ru-RU",
  en: "en-US",
};

export function getBcp47Locale(locale: AppLocale): string {
  return BCP47_LOCALE[locale] ?? "pl-PL";
}
