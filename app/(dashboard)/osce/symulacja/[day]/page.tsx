import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("osce");
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
        <OsceBreadcrumbSetter second={t("courseTitle")} third={t("simulationShort")} />
        <Link
          href="/osce/symulacja"
          className="mb-6 inline-flex items-center gap-2 font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("simulation")}
        </Link>
        <h1 className="font-heading text-heading-xl text-primary">
          {t("simulationDayTitle", { day })}
        </h1>
        <p className="mt-4 font-body text-body-md text-secondary">
          {t("noStationsFiltered")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <OsceBreadcrumbSetter
        second={t("courseTitle")}
        third={t("simulationBreadcrumb", { day })}
      />

      <Link
        href="/osce/symulacja"
        className="mb-6 inline-flex items-center gap-2 font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("simulation")}
      </Link>

      <h1 className="font-heading text-heading-xl text-primary">
        {t("simulationDayFullTitle", { day })}
      </h1>
      <p className="mt-2 font-body text-body-md text-secondary">
        {t("sessionStationsCount", {
          count: stations.length,
          selectedSuffix:
            onlyIds.length > 0 ? t("sessionStationsSelectedSuffix") : "",
        })}
      </p>

      <div className="mt-10">
        <OSCESimulation examDay={day as 1 | 2} stations={stations} />
      </div>
    </div>
  );
}
