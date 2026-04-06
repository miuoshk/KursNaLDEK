import Link from "next/link";
import type { PulpitData } from "@/features/pulpit/server/loadPulpit";

export function PulpitQuickStart({ data }: { data: PulpitData }) {
  return (
    <section className="rounded-card border-l-[3px] border-brand-gold bg-brand-card-1 p-6">
      <h2 className="font-heading text-heading-md text-primary">Kontynuuj naukę</h2>
      {data.lastSubjectId && data.lastSubjectName ? (
        <>
          <p className="mt-2 font-body text-body-sm text-secondary">
            {data.lastSubjectName} — {data.lastSubjectMasteryPct}% opanowania
          </p>
          <div className="mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
            <div
              className="h-full rounded-full bg-brand-gold transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(100, data.lastSubjectMasteryPct)}%` }}
            />
          </div>
          <Link
            href={`/sesja/new?subject=${encodeURIComponent(data.lastSubjectId)}&mode=inteligentna&count=10`}
            className="mt-6 inline-flex rounded-btn bg-brand-gold px-5 py-2.5 font-body font-semibold text-brand-bg transition hover:brightness-110"
          >
            Rozpocznij sesję →
          </Link>
        </>
      ) : (
        <p className="mt-2 font-body text-body-sm text-secondary">
          Rozpocznij pierwszą sesję z listy przedmiotów.
        </p>
      )}
    </section>
  );
}
