"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { localeLabels, locales, type AppLocale } from "@/i18n/config";
import { updateLocale } from "@/features/settings/api/updateLocale";
import { cn } from "@/lib/utils";

export function LanguageSection() {
  const t = useTranslations("settings");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSelect(nextLocale: AppLocale) {
    if (nextLocale === locale || pending) return;
    const formData = new FormData();
    formData.set("locale", nextLocale);
    startTransition(async () => {
      await updateLocale(formData);
      router.refresh();
    });
  }

  return (
    <section className="rounded-card border border-white/10 bg-card p-6">
      <h2 className="font-heading text-lg font-semibold text-primary">
        {t("language.sectionTitle")}
      </h2>
      <p className="mt-1 font-body text-sm text-secondary">
        {t("language.description")}
      </p>
      <p className="mt-3 rounded-btn border border-white/10 bg-white/5 px-3 py-2 font-body text-xs text-muted">
        {t("language.contentNotice")}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {locales.map((code) => {
          const selected = code === locale;
          return (
            <button
              key={code}
              type="button"
              disabled={pending}
              onClick={() => onSelect(code)}
              className={cn(
                "rounded-btn border px-4 py-3 text-left font-body text-sm transition",
                selected
                  ? "border-brand-gold/50 bg-brand-gold/10 text-primary"
                  : "border-white/10 bg-white/5 text-secondary hover:bg-white/10 hover:text-primary",
                pending && "opacity-60",
              )}
            >
              <span className="font-medium">{localeLabels[code]}</span>
              {selected && (
                <span className="mt-0.5 block text-xs text-brand-gold">
                  {t("language.selected")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
