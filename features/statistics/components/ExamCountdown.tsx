"use client";

import { differenceInCalendarDays } from "date-fns";
import { useTranslations } from "next-intl";

const EXAM = new Date("2026-06-15T12:00:00");

export function ExamCountdown() {
  const t = useTranslations("statistics");
  const now = new Date();
  const days = Math.max(0, differenceInCalendarDays(EXAM, now));
  const pct = Math.min(100, Math.round((1 - days / 365) * 100));

  return (
    <div className="rounded-card bg-card p-6">
      <p className="font-body text-body-xs font-medium uppercase tracking-wide text-secondary">
        {t("examCountdown.title")}
      </p>
      <p className="mt-3 font-body text-4xl text-brand-gold">
        {t("examCountdown.days", { count: days })}
      </p>
      <p className="mt-1 font-body text-body-xs text-muted">{t("examCountdown.date")}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-brand-sage transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
