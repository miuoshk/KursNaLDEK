"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { buildSessionStartHref } from "@/features/session/lib/sessionCount";
import type { PulpitData } from "@/features/pulpit/server/loadPulpit";
import { cn } from "@/lib/utils";

export function PulpitQuickStart({ data }: { data: PulpitData }) {
  const t = useTranslations("pulpit");
  const tCommon = useTranslations("common");
  const hasDue = data.dueReviews > 0;
  const hasHistory = !!data.lastSubjectId && !!data.lastSubjectName;

  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-primary">
        {t("startLearning")}
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReviewCard
          dueReviews={data.dueReviews}
          dueSubjects={data.dueSubjects}
          hasDue={hasDue}
          sessionCount={data.preferredSessionCount}
          t={t}
          tCommon={tCommon}
        />
        <ContinueCard
          hasHistory={hasHistory}
          lastSubjectId={data.lastSubjectId}
          lastSubjectName={data.lastSubjectName}
          lastSubjectMasteryPct={data.lastSubjectMasteryPct}
          t={t}
        />
      </div>
    </section>
  );
}

function ReviewCard({
  dueReviews,
  dueSubjects,
  hasDue,
  sessionCount,
  t,
  tCommon,
}: {
  dueReviews: number;
  dueSubjects: PulpitData["dueSubjects"];
  hasDue: boolean;
  sessionCount: number;
  t: ReturnType<typeof useTranslations<"pulpit">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  const reviewCount = Math.min(sessionCount, dueReviews);
  const allDueHref = buildSessionStartHref({
    mode: "inteligentna",
    count: reviewCount,
    focus: "due",
  });

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-6",
        hasDue
          ? "border-brand-gold/20 ring-1 ring-brand-gold/20 shadow-[0_0_20px_rgba(201,168,76,0.08)]"
          : "border-border",
      )}
    >
      {hasDue ? (
        <>
          <p className="font-heading text-lg font-bold text-primary">
            {t("reviewsToday")}
          </p>
          <p className="mt-3 font-heading text-3xl font-bold text-brand-gold">
            {tCommon("questionsCount", { count: dueReviews })}
          </p>
          <p className="mt-2 font-body text-sm text-secondary">
            {t("reviewsTodayHint")}
          </p>
          <Link
            href={allDueHref}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-brand-gold px-6 py-3 font-body font-semibold text-background transition-all duration-200 ease-out hover:brightness-110"
          >
            {t("allReviews", { count: reviewCount })}
          </Link>
          {dueSubjects.length > 0 ? (
            <div className="mt-4 border-t border-border pt-4">
              <p className="font-body text-xs uppercase tracking-widest text-muted">
                {t("bySubject")}
              </p>
              <ul className="mt-2 space-y-1">
                {dueSubjects.map((subject) => {
                  const subjectCount = Math.min(sessionCount, subject.count);
                  const href = buildSessionStartHref({
                    subject: subject.id,
                    mode: "inteligentna",
                    count: subjectCount,
                    focus: "due",
                  });
                  return (
                    <li key={subject.id}>
                      <Link
                        href={href}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 font-body text-sm text-secondary transition-colors duration-200 ease-out hover:bg-white/[0.04] hover:text-primary"
                      >
                        <span className="truncate pr-2">{subject.name}</span>
                        <span className="shrink-0 font-medium text-brand-gold">
                          {subject.count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p className="font-heading text-lg font-bold text-primary">
            {t("reviews")}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <CheckCircle className="size-5 text-secondary" aria-hidden />
            <p className="font-body text-lg text-primary">{t("reviewsCaughtUp")}</p>
          </div>
          <p className="mt-2 font-body text-sm text-secondary">
            {t("nextReviewHint")}
          </p>
        </>
      )}
    </div>
  );
}

function ContinueCard({
  hasHistory,
  lastSubjectId,
  lastSubjectName,
  lastSubjectMasteryPct,
  t,
}: {
  hasHistory: boolean;
  lastSubjectId: string | null;
  lastSubjectName: string | null;
  lastSubjectMasteryPct: number;
  t: ReturnType<typeof useTranslations<"pulpit">>;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
      {hasHistory ? (
        <>
          <p className="font-heading text-lg font-bold text-primary">
            {t("continue")}
          </p>
          <p className="mt-3 font-heading text-xl text-primary">
            {lastSubjectName}
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-gold transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(100, lastSubjectMasteryPct)}%` }}
            />
          </div>
          <p className="mt-2 font-body text-sm text-secondary">
            {t("masteryPercent", { percent: lastSubjectMasteryPct })}
          </p>
          <Link
            href={`/przedmioty/${lastSubjectId}`}
            className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-brand-gold/40 px-6 py-3 pt-6 font-body font-semibold text-brand-gold transition-colors duration-200 ease-out hover:bg-brand-gold/10"
          >
            {t("startSession")}
          </Link>
        </>
      ) : (
        <>
          <p className="font-heading text-lg font-bold text-primary">
            {t("continue")}
          </p>
          <p className="mt-3 font-body text-sm text-secondary">
            {t("chooseSubjectHint")}
          </p>
          <Link
            href="/przedmioty"
            className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-brand-gold/40 px-6 py-3 pt-6 font-body font-semibold text-brand-gold transition-colors duration-200 ease-out hover:bg-brand-gold/10"
          >
            {t("browseSubjects")}
          </Link>
        </>
      )}
    </div>
  );
}
