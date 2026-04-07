import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OSCESimulation } from "@/features/osce/components/OSCESimulation";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";
import { loadOsceSimulationStations } from "@/features/osce/server/loadOsceSimulationStations";

type PageProps = {
  params: Promise<{ day: string }>;
  searchParams: Promise<{ only?: string }>;
};

export default async function OsceSimulationDayPage({ params, searchParams }: PageProps) {
  const { day: dayStr } = await params;
  const { only: onlyParam } = await searchParams;

  const day = Number.parseInt(dayStr, 10);
  if (day !== 1 && day !== 2) {
    notFound();
  }

  const allStations = await loadOsceSimulationStations(day as 1 | 2);
  const onlyIds =
    onlyParam
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const stations =
    onlyIds.length > 0 ? allStations.filter((s) => onlyIds.includes(s.id)) : allStations;

  if (stations.length === 0) {
    return (
      <div>
        <OsceBreadcrumbSetter second="Kurs na OSCE" third="Symulacja" />
        <Link
          href="/osce/symulacja"
          className="mb-6 inline-flex items-center gap-2 font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Symulacja OSCE
        </Link>
        <h1 className="font-heading text-heading-xl text-primary">Symulacja — dzień {day}</h1>
        <p className="mt-4 font-body text-body-md text-secondary">
          Brak stacji do wyświetlenia (filtr lub brak danych w bazie).
        </p>
      </div>
    );
  }

  return (
    <div>
      <OsceBreadcrumbSetter second="Kurs na OSCE" third={`Symulacja · dzień ${day}`} />

      <Link
        href="/osce/symulacja"
        className="mb-6 inline-flex items-center gap-2 font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Symulacja OSCE
      </Link>

      <h1 className="font-heading text-heading-xl text-primary">Symulacja OSCE — dzień {day}</h1>
      <p className="mt-2 font-body text-body-md text-secondary">
        {stations.length}{" "}
        {stations.length === 1 ? "stacja" : stations.length < 5 ? "stacje" : "stacji"} w tej sesji
        {onlyIds.length > 0 ? " (tylko wybrane)" : ""}.
      </p>

      <div className="mt-10">
        <OSCESimulation examDay={day as 1 | 2} stations={stations} />
      </div>
    </div>
  );
}
