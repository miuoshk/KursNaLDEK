import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { OSCEExamFormatModal } from "@/features/osce/components/OSCEExamFormatModal";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";
import { OsceStationCard } from "@/features/osce/components/OsceStationCard";
import { groupOsceStationsByDay } from "@/features/osce/lib/groupOsceStationsByDay";
import { loadOsceStations } from "@/features/osce/server/loadOsceStations";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { getBcp47Locale } from "@/lib/i18n/bcp47Locale";
import type { AppLocale } from "@/i18n/config";

function formatExamDate(date: string | null, locale: AppLocale): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(getBcp47Locale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dayGroupTitle(
  key: "day1" | "day2" | "bonus",
  t: Awaited<ReturnType<typeof getTranslations<"osce">>>,
): string {
  if (key === "day1") return t("dayGroupDay1");
  if (key === "day2") return t("dayGroupDay2");
  return t("dayGroupBonus");
}

export default async function OsceListPage() {
  const t = await getTranslations("osce");
  const locale = (await getLocale()) as AppLocale;
  const result = await loadOsceStations();

  if (!result.ok) {
    return (
      <div>
        <OsceBreadcrumbSetter second={t("courseTitle")} />
        <h1 className="font-heading text-heading-xl text-primary">{t("courseTitle")}</h1>
        <div className="mt-8">
          <PrzedmiotyError message={result.message} />
        </div>
      </div>
    );
  }

  const stations = result.stations;
  const groups = groupOsceStationsByDay(result.stations).filter(
    (group) => group.key === "day1" || group.key === "day2",
  );
  const examDate = formatExamDate(result.examDate, locale);
  const stationCount = stations.length;
  const taskCount = stations.reduce((sum, station) => sum + (station.exam_tasks?.length ?? 0), 0);
  const passThreshold =
    stations.find((station) => typeof station.pass_threshold === "number")?.pass_threshold ?? 60;

  return (
    <div>
      <OsceBreadcrumbSetter second={t("courseTitle")} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-heading-xl text-primary">{t("courseTitle")}</h1>
          <p className="mt-2 font-body text-body-md text-secondary">
            {examDate ? t("examPracticalWithDate", { date: examDate }) : t("examPractical")}
          </p>
          <p className="mt-2 font-body text-sm text-white/70">
            {t("listStats", {
              stations: stationCount,
              tasks: taskCount,
              threshold: passThreshold,
            })}
          </p>
        </div>
        <OSCEExamFormatModal />
      </div>

      <div className="mt-10 space-y-12">
        {stations.length === 0 ? (
          <p className="font-body text-body-md text-secondary">{t("noStations")}</p>
        ) : (
          groups.map((group) => (
            <section key={group.key} aria-labelledby={`osce-group-${group.key}`}>
              <h2
                id={`osce-group-${group.key}`}
                className="font-serif text-lg text-[#C9A84C]"
              >
                {dayGroupTitle(group.key, t)}
              </h2>
              <ul className="mt-6 grid list-none grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.stations.map((station, index) => (
                  <OsceStationCard
                    key={station.id}
                    station={station}
                    fullWidthOnLarge={group.key === "day2" && group.stations.length === 4 && index === 3}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <div className="mt-12">
        <Link
          href="/osce/symulacja"
          className="inline-flex rounded-xl border border-[#C9A84C]/30 px-6 py-3 font-body text-sm font-medium text-[#C9A84C] transition-colors hover:bg-[#C9A84C]/10"
        >
          {t("simulationModeLink")}
        </Link>
      </div>
    </div>
  );
}
