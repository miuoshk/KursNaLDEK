import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Info, Lightbulb } from "lucide-react";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";
import { OsceExamTasksBox } from "@/features/osce/components/OsceExamTasksBox";
import { loadOsceStation } from "@/features/osce/server/loadOsceStation";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ stationId: string }>;
};

export default async function OsceStationPage({ params }: PageProps) {
  const { stationId } = await params;
  const result = await loadOsceStation(stationId);

  if (!result.ok) {
    if (result.kind === "not_found") {
      notFound();
    }
    return (
      <div>
        <OsceBreadcrumbSetter second="Kurs na OSCE" third={stationId} />
        <h1 className="font-heading text-heading-xl text-primary">Stacja OSCE</h1>
        <div className="mt-8">
          <PrzedmiotyError message={result.message} />
        </div>
      </div>
    );
  }

  const { station, topics } = result;
  const passThreshold = station.pass_threshold ?? 60;

  return (
    <div>
      <OsceBreadcrumbSetter second="Kurs na OSCE" third={station.short_name} />

      <Link
        href="/osce"
        className="mb-6 inline-flex items-center gap-2 font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Lista stacji
      </Link>

      <h1 className="font-heading text-heading-xl text-primary">{station.name}</h1>
      <p className="mt-2 font-body text-body-md text-secondary">{station.short_name}</p>
      <span className="mt-3 inline-flex rounded-full bg-[#367368]/10 px-2 py-1 font-body text-xs text-[#367368]">
        Próg zaliczenia: {passThreshold}%
      </span>

      <div className="mt-8 space-y-10">
        <OsceExamTasksBox examTasks={station.exam_tasks} />

        {station.competencies != null && station.competencies.length > 0 ? (
          <section aria-labelledby="osce-competencies-heading">
            <h2
              id="osce-competencies-heading"
              className="font-body text-sm font-medium text-[#C9A84C]"
            >
              Efekty kształcenia sprawdzane na tej stacji
            </h2>
            <ul className="mt-4 grid list-none grid-cols-1 gap-3 md:grid-cols-2">
              {station.competencies.map((competency, index) => (
                <li
                  key={`${competency.code}-${index}`}
                  className="rounded-lg border border-[#367368]/10 bg-[#367368]/5 p-3"
                >
                  <p className="font-body text-sm font-bold text-[#C9A84C]">{competency.code}</p>
                  <p className="mt-1 font-body text-xs text-white/50">{competency.description}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {station.exam_info != null ? (
          <section aria-label="Informacje egzaminacyjne">
            <div className="rounded-lg border border-[#C9A84C]/10 bg-[#C9A84C]/5 p-4">
              <div className="flex items-start gap-2.5">
                <Info className="mt-0.5 size-4 shrink-0 text-[#C9A84C]" aria-hidden />
                <div className="space-y-1.5">
                  <p className="font-body text-sm text-white/80">
                    Format: <span className="text-white">{station.exam_info.format}</span>
                  </p>
                  <p className="inline-flex items-start gap-1.5 font-body text-sm text-[#C9A84C]/80">
                    <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>{station.exam_info.tip}</span>
                  </p>
                  {station.exam_info.source ? (
                    <p className="font-body text-xs text-white/30">
                      Źródło: {station.exam_info.source}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="osce-topics-heading">
          <h2 id="osce-topics-heading" className="font-heading text-heading-md text-primary">
            Tematy
          </h2>
          {topics.length === 0 ? (
            <p className="mt-6 font-body text-body-md text-muted">
              Brak tematów. Tematy zostaną dodane wkrótce.
            </p>
          ) : (
            <ul className="mt-6 grid list-none grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {topics.map((topic) => (
                <li key={topic.id}>
                  <Link
                    href={`/osce/${station.id}/${topic.id}`}
                    className={cn(
                      "flex h-full flex-col rounded-card border border-[rgba(255,255,255,0.06)] bg-card p-5",
                      "transition-all duration-200 ease-out hover:border-brand-sage/35",
                    )}
                  >
                    <span className="font-body text-body-md font-semibold text-primary">
                      {topic.name}
                    </span>
                    <span className="mt-2 font-body text-body-xs text-muted">
                      {topic.question_count}{" "}
                      {topic.question_count === 1 ? "pytanie" : "pytań"}
                    </span>
                    <span className="mt-4 inline-flex items-center gap-1 font-body text-body-sm font-medium text-brand-sage">
                      Sesja pytań
                      <ChevronRight className="size-4" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
