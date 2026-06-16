export const locales = ["pl", "uk", "ru", "en"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "pl";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeLabels: Record<AppLocale, string> = {
  pl: "Polski",
  uk: "Українська",
  ru: "Русский",
  en: "English",
};

/** Kolejność w panelu języka: wiersz 1 → pl, en; wiersz 2 → ru, uk */
export const localePickerRows: readonly (readonly AppLocale[])[] = [
  ["pl", "en"],
  ["ru", "uk"],
];

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return locales.includes(value as AppLocale);
}

export function resolveLocaleFromAcceptLanguage(header: string | null): AppLocale {
  if (!header) return defaultLocale;

  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      return { tag: tag?.toLowerCase() ?? "", q: qPart ? Number(qPart) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferred) {
    if (tag.startsWith("uk")) return "uk";
    if (tag.startsWith("ru")) return "ru";
    if (tag.startsWith("en")) return "en";
    if (tag.startsWith("pl")) return "pl";
  }

  return defaultLocale;
}
