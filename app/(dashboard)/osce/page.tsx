import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";
import { groupOsceStationsByDay } from "@/features/osce/lib/groupOsceStationsByDay";
import { loadOsceStations } from "@/features/osce/server/loadOsceStations";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { cn } from "@/lib/utils";

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
                {group.stations.map((station) => (
                  <li key={station.id}>
                    <Link
                      href={`/osce/${station.id}`}
                      className={cn(
                        "group flex flex-col rounded-card border border-[rgba(255,255,255,0.06)] bg-card p-5",
                        "transition-all duration-200 ease-out hover:border-brand-sage/35",
                      )}
                    >
                      <span className="font-body text-body-md font-semibold text-primary group-hover:text-brand-gold">
                        {station.name}
                      </span>
                      <span className="mt-1 font-body text-body-sm text-secondary">
                        {station.short_name}
                      </span>
                      <span className="mt-4 inline-flex items-center gap-1 font-body text-body-sm font-medium text-brand-sage transition-colors group-hover:text-brand-gold">
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

      <p className="mt-12 font-body text-body-sm text-muted">
        <Link href="/osce/symulacja" className="text-brand-sage transition-colors hover:text-brand-gold">
          Tryb symulacji OSCE
        </Link>
        <span className="text-muted"> — wkrótce</span>
      </p>
    </div>
  );
}
