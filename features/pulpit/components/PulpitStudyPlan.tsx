"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { buildSessionStartHref } from "@/features/session/lib/sessionCount";
import type { PulpitData } from "@/features/pulpit/server/loadPulpit";
import { pytaniaForm } from "@/lib/pluralizePolish";

function examVerdictShort(score: number | null): string | null {
  if (score == null) return null;
  if (score >= 80) return "Dobra forma egzaminacyjna";
  if (score >= 60) return "Na dobrej drodze do egzaminu";
  if (score >= 40) return "Wymaga systematycznej pracy";
  return "Dużo materiału przed Tobą";
}

export function PulpitStudyPlan({ data }: { data: PulpitData }) {
  const remaining = Math.max(0, data.dailyGoal - data.questionsToday);
  const sessionCount = data.preferredSessionCount;
  const href = buildSessionStartHref({
    subject: data.lastSubjectId ?? undefined,
    mode: "inteligentna",
    count: sessionCount,
  });
  const verdict = examVerdictShort(data.examReadinessScore);

  return (
    <section className="rounded-2xl border border-brand-sage/25 bg-card p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-5 shrink-0 text-brand-sage" aria-hidden />
            <h2 className="font-heading text-lg font-bold text-primary">
              Plan na dziś
            </h2>
          </div>
          <p className="mt-2 font-body text-body-sm text-secondary">
            {data.questionsToday} / {data.dailyGoal}{" "}
            {pytaniaForm(data.dailyGoal)} dziennie
            {data.dueReviews > 0
              ? ` · ${data.dueReviews} ${pytaniaForm(data.dueReviews)} do powtórki`
              : " · powtórki na bieżąco"}
          </p>
          {remaining > 0 ? (
            <p className="mt-1 font-body text-body-xs text-muted">
              Zostało {remaining} {pytaniaForm(remaining)} do celu dziennego
            </p>
          ) : (
            <p className="mt-1 font-body text-body-xs text-brand-gold">
              Cel dzienny osiągnięty — możesz iść dalej lub odpocząć.
            </p>
          )}
          {verdict ? (
            <p className="mt-2 font-body text-body-xs text-muted">
              Gotowość: {data.examReadinessScore}% — {verdict}
            </p>
          ) : null}
        </div>

        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-sage px-6 py-3 font-body font-semibold text-white transition duration-200 ease-out hover:bg-[#4a9085] hover:shadow-[0_0_16px_rgba(54,115,104,0.35)]"
        >
          Sesja {sessionCount} {pytaniaForm(sessionCount)}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
