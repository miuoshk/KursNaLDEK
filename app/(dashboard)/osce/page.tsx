import Link from "next/link";
import { ChevronRight, ClipboardList, Lock } from "lucide-react";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";
import { groupOsceStationsByDay } from "@/features/osce/lib/groupOsceStationsByDay";
import { loadOsceStations } from "@/features/osce/server/loadOsceStations";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { cn } from "@/lib/utils";

function taskCountLabel(n: number): string {
  if (n === 1) return "zadanie";
  if (n >= 2 && n <= 4) return "zadania";
  return "zadań";
}

export default async function OsceListPage() {
  const result = await loadOsceStations();

  if (!result.ok) {
    return (
      <div>
        <OsceBreadcrumbSetter second="Kurs na OSCE" />
        <h1 className="font-heading text-heading-xl text-primary">Kurs na OSCE</h1>
        <div className="mt-8">
          <PrzedmiotyError message={result.message} />
        </div>
      </div>
    );
  }

  const groups = groupOsceStationsByDay(result.stations);

  return (
    <div>
      <OsceBreadcrumbSetter second="Kurs na OSCE" />
      <h1 className="font-heading text-heading-xl text-primary">Kurs na OSCE</h1>
      <p className="mt-2 font-body text-body-md text-secondary">
        Stacje egzaminu OSCE — wybierz stację, aby zobaczyć tematy i zadania.
      </p>

      <div className="mt-10 space-y-12">
        {result.stations.length === 0 ? (
          <p className="font-body text-body-md text-secondary">
            Brak stacji do wyświetlenia. Skontaktuj się z administratorem lub spróbuj później.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.key} aria-labelledby={`osce-group-${group.key}`}>
              <h2
                id={`osce-group-${group.key}`}
                className="font-heading text-heading-md text-brand-gold"
              >
                {group.title}
              </h2>
              <ul className="mt-6 grid list-none grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.stations.map((station, idx) => (
                  <li key={station.id}>
                    <Link
                      href={`/osce/${station.id}`}
                      className={cn(
                        "group flex h-full flex-col rounded-card border border-border bg-card p-5",
                        "transition-all duration-200 ease-out hover:border-brand-sage/40",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-sage/15 font-body text-body-sm font-bold text-brand-sage">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block font-body text-body-md font-semibold text-primary group-hover:text-brand-gold">
                            {station.name}
                          </span>
                          <span className="mt-1 block font-body text-body-sm text-secondary">
                            {station.short_name}
                          </span>
                        </div>
                      </div>

                      {station.exam_tasks && station.exam_tasks.length > 0 && (
                        <span className="mt-3 inline-flex items-center gap-1.5 font-body text-body-xs text-muted">
                          <ClipboardList className="size-3.5" aria-hidden />
                          {station.exam_tasks.length}{" "}
                          {taskCountLabel(station.exam_tasks.length)}
                        </span>
                      )}

                      <span className="mt-auto inline-flex items-center gap-1 pt-4 font-body text-body-sm font-medium text-brand-sage transition-colors group-hover:text-brand-gold">
                        Otwórz stację
                        <ChevronRight className="size-4" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <div className="mt-12">
        <span
          aria-disabled="true"
          className={cn(
            "inline-flex cursor-not-allowed items-center gap-2 rounded-btn border border-border px-4 py-2.5",
            "font-body text-body-sm font-medium text-muted opacity-50",
          )}
        >
          <Lock className="size-3.5" aria-hidden />
          Tryb symulacji OSCE — wkrótce
        </span>
      </div>
    </div>
  );
}
