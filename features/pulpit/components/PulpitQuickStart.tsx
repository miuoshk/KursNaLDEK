import Link from "next/link";
import { CheckCircle } from "lucide-react";
import type { PulpitData } from "@/features/pulpit/server/loadPulpit";
import { cn } from "@/lib/utils";

export function PulpitQuickStart({ data }: { data: PulpitData }) {
  const hasDue = data.dueReviews > 0;
  const hasHistory = !!data.lastSubjectId && !!data.lastSubjectName;

  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-primary">
        Rozpocznij naukę
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReviewCard
          dueReviews={data.dueReviews}
          lastSubjectId={data.lastSubjectId}
          hasDue={hasDue}
        />
        <ContinueCard
          hasHistory={hasHistory}
          lastSubjectId={data.lastSubjectId}
          lastSubjectName={data.lastSubjectName}
          lastSubjectMasteryPct={data.lastSubjectMasteryPct}
        />
      </div>
    </section>
  );
}

function ReviewCard({
  dueReviews,
  lastSubjectId,
  hasDue,
}: {
  dueReviews: number;
  lastSubjectId: string | null;
  hasDue: boolean;
}) {
  const reviewHref = lastSubjectId
    ? `/sesja/new?subjectId=${encodeURIComponent(lastSubjectId)}&mode=inteligentna`
    : "/sesja/new?mode=inteligentna&count=10";

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
            Powtórki na dziś
          </p>
          <p className="mt-3 font-heading text-3xl font-bold text-brand-gold">
            {dueReviews} pytań
          </p>
          <p className="mt-2 font-body text-sm text-secondary">
            Algorytm ANTARES zaplanował te powtórki na podstawie Twojego tempa
            nauki
          </p>
          <Link
            href={reviewHref}
            className="mt-auto inline-flex w-full items-center justify-center rounded-xl bg-brand-gold px-6 py-3 pt-6 font-body font-semibold text-background transition-all duration-200 ease-out hover:brightness-110"
          >
            Rozpocznij powtórkę
          </Link>
        </>
      ) : (
        <>
          <p className="font-heading text-lg font-bold text-primary">
            Powtórki
          </p>
          <div className="mt-4 flex items-center gap-2">
            <CheckCircle className="size-5 text-secondary" aria-hidden />
            <p className="font-body text-lg text-primary">Jesteś na bieżąco!</p>
          </div>
          <p className="mt-2 font-body text-sm text-secondary">
            Następna powtórka pojawi się po kolejnych sesjach
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
}: {
  hasHistory: boolean;
  lastSubjectId: string | null;
  lastSubjectName: string | null;
  lastSubjectMasteryPct: number;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
      {hasHistory ? (
        <>
          <p className="font-heading text-lg font-bold text-primary">
            Kontynuuj
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
            {lastSubjectMasteryPct}% opanowania
          </p>
          <Link
            href={`/przedmioty/${lastSubjectId}`}
            className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-brand-gold/40 px-6 py-3 pt-6 font-body font-semibold text-brand-gold transition-colors duration-200 ease-out hover:bg-brand-gold/10"
          >
            Rozpocznij sesję
          </Link>
        </>
      ) : (
        <>
          <p className="font-heading text-lg font-bold text-primary">
            Kontynuuj
          </p>
          <p className="mt-3 font-body text-sm text-secondary">
            Wybierz przedmiot i zacznij swoją pierwszą sesję!
          </p>
          <Link
            href="/przedmioty"
            className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-brand-gold/40 px-6 py-3 pt-6 font-body font-semibold text-brand-gold transition-colors duration-200 ease-out hover:bg-brand-gold/10"
          >
            Przeglądaj przedmioty
          </Link>
        </>
      )}
    </div>
  );
}
