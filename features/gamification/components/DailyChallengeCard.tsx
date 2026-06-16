"use client";

import { useTranslations } from "next-intl";

export function DailyChallengeSection() {
  const t = useTranslations("gamification");

  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-primary">{t("challenges.title")}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-card border border-[rgba(255,255,255,0.06)] bg-card p-5">
          <h3 className="font-body text-body-md font-semibold text-primary">
            {t("challenges.biochemTitle")}
          </h3>
          <p className="mt-2 font-body text-body-sm text-secondary">
            {t("challenges.biochemDescription")}
          </p>
          <p className="mt-4 font-body text-body-xs text-muted">
            {t("challenges.progress", { current: 0, total: 15 })}
          </p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div className="h-full w-0 rounded-full bg-brand-gold/70" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-pill bg-brand-gold/10 px-2 py-0.5 font-body text-body-xs text-brand-gold">
              {t("challenges.xpReward", { xp: 50 })}
            </span>
            <span className="font-body text-body-xs text-muted">{t("challenges.timeLeft")}</span>
          </div>
        </article>

        <article className="rounded-card border border-[rgba(255,255,255,0.06)] bg-card p-5">
          <h3 className="font-body text-body-md font-semibold text-primary">
            {t("challenges.anatomyTitle")}
          </h3>
          <p className="mt-2 font-body text-body-sm text-secondary">
            {t("challenges.anatomyDescription")}
          </p>
          <p className="mt-4 font-body text-body-xs text-muted">
            {t("challenges.progress", { current: 0, total: 10 })}
          </p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div className="h-full w-0 rounded-full bg-brand-gold/70" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-pill bg-brand-gold/10 px-2 py-0.5 font-body text-body-xs text-brand-gold">
              {t("challenges.xpReward", { xp: 40 })}
            </span>
            <span className="font-body text-body-xs text-muted">{t("challenges.timeLeft")}</span>
          </div>
        </article>
      </div>
    </section>
  );
}
