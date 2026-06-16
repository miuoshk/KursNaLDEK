"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Clock, Lock } from "lucide-react";
import type { SubjectWithProgress } from "@/features/subjects/types";
import { getSubjectIcon } from "@/features/subjects/iconMap";
import { cn } from "@/lib/utils";
import { dzialForm } from "@/lib/pluralizePolish";

type SubjectCardProps = {
  subject: SubjectWithProgress;
  locked?: boolean;
};

type RelativeDateTranslator = (
  key: "today" | "yesterday" | "daysAgo" | "weekAgo" | "weeksAgo",
  values?: { count?: number },
) => string;

function formatLastStudied(
  iso: string | null,
  t: RelativeDateTranslator,
  locale: string,
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) return t("today");
  if (diffDays === 1) return t("yesterday");
  if (diffDays < 7) return t("daysAgo", { count: diffDays });
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? t("weekAgo") : t("weeksAgo", { count: weeks });
  }
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export function SubjectCard({ subject, locked }: SubjectCardProps) {
  const t = useTranslations("subjects");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const Icon = getSubjectIcon(subject.icon_name);
  const mastery = subject.mastery_percentage;
  /** Brak aktywnych pytań (w tym gdy wszystkie są zdezaktywowane w adminie). */
  const noActiveQuestions = subject.question_count === 0;
  /** Pusty przedmiot — jeszcze bez struktury tematów. */
  const contentInPrep = noActiveQuestions && subject.topic_count === 0;
  const isDisabled = locked || noActiveQuestions;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <Icon
          className={cn(
            "size-5 shrink-0 transition-colors duration-200 ease-out",
            isDisabled
              ? "text-secondary grayscale"
              : "text-secondary group-hover:text-brand-sage",
          )}
          aria-hidden
        />
        {noActiveQuestions ? (
          <div className="flex items-center gap-1.5 text-right">
            {contentInPrep && (
              <Clock className="size-3.5 text-muted" aria-hidden />
            )}
            <p className="font-body text-body-sm text-muted">
              {contentInPrep ? t("comingSoon") : t("unavailable")}
            </p>
          </div>
        ) : (
          <div className="text-right">
            <p className="font-body text-lg text-secondary">{mastery}%</p>
            <p className="font-body text-body-xs text-muted">{t("mastery")}</p>
            {subject.due_reviews > 0 ? (
              <p className="mt-1 font-body text-body-xs font-medium text-brand-gold">
                {t("reviewsShort", { count: subject.due_reviews })}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <h2 className="mt-3 font-heading text-body-lg text-primary">
        {subject.name}
      </h2>

      {noActiveQuestions ? (
        <p className="mt-2 font-body text-body-sm text-muted">
          {contentInPrep
            ? t("comingSoonAvailable")
            : t("noActiveQuestions")}
        </p>
        ) : (
          <p className="mt-2 font-body text-body-sm text-muted">
            {tCommon("questionsCount", { count: subject.question_count })} · {subject.topic_count} {dzialForm(subject.topic_count)}
            {subject.due_reviews > 0 ? (
              <span className="text-brand-gold">
                {t("dueForReview", { count: subject.due_reviews })}
              </span>
            ) : null}
          </p>
        )}

      {!noActiveQuestions && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-brand-gold/80 transition-[width] duration-200"
            style={{ width: `${mastery}%` }}
          />
        </div>
      )}

      <div
        className={cn(
          "mt-4 flex items-center justify-between gap-2",
          noActiveQuestions && "mt-auto pt-4",
        )}
      >
        {noActiveQuestions ? (
          <p className="font-body text-body-xs text-muted">
            {contentInPrep ? t("contentInPrep") : t("questionsDisabledAdmin")}
          </p>
        ) : (
          <p className="font-body text-body-xs text-muted">
            {t("lastStudied", { when: formatLastStudied(subject.last_studied_at, t, locale) })}
          </p>
        )}
        {!isDisabled && (
          <span className="inline-flex items-center rounded-lg border border-brand-sage/40 px-3 py-1 font-body text-body-sm font-medium text-brand-sage transition-colors duration-200 ease-out group-hover:bg-brand-sage/10">
            {t("open")}
          </span>
        )}
      </div>

      {locked && !noActiveQuestions && (
        <div className="absolute inset-0 flex items-center justify-center rounded-card bg-background/60">
          <div className="flex flex-col items-center gap-2">
            <Lock className="size-5 text-secondary" aria-hidden />
            <span className="font-body text-body-xs text-muted">
              {t("paymentRequired")}
            </span>
          </div>
        </div>
      )}
    </>
  );

  if (isDisabled) {
    return (
      <div
        className={cn(
          "group relative flex flex-col rounded-card border border-border bg-card p-5",
          isDisabled && "pointer-events-none opacity-60",
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/przedmioty/${subject.id}`}
      className={cn(
        "group relative flex flex-col rounded-card border border-border bg-card p-5",
        "cursor-pointer transition-all duration-200 ease-out",
        "hover:border-brand-sage/30",
      )}
    >
      {content}
    </Link>
  );
}
