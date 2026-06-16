import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";
import { loadOsceSimulationHistory } from "@/features/osce/server/loadOsceSimulationHistory";
import { loadOsceSimulationStations } from "@/features/osce/server/loadOsceSimulationStations";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import type { AppLocale } from "@/i18n/config";
import { getBcp47Locale } from "@/lib/i18n/bcp47Locale";
import { cn } from "@/lib/utils";

function formatLocaleDate(iso: string, locale: AppLocale): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(getBcp47Locale(locale), {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default async function OsceSymulacjaPage() {
  const t = await getTranslations("osce");
  const locale = (await getLocale()) as AppLocale;
  const [day1, day2, history] = await Promise.all([
    loadOsceSimulationStations(1),
    loadOsceSimulationStations(2),
    loadOsceSimulationHistory(),
  ]);

  const histOk = history.ok ? history.rows : null;
  const histErr = !history.ok ? history.message : null;

  return (
    <div>
      <OsceBreadcrumbSetter second={t("courseTitle")} third={t("simulationShort")} />

      <h1 className="font-heading text-heading-xl text-primary">{t("simulation")}</h1>
      <p className="mt-2 font-body text-body-md text-secondary">
        {t("simulationDescription")}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/osce/symulacja/1"
          className={cn(
            "rounded-card border border-border bg-card p-6 transition",
            "hover:border-brand-sage/50 hover:bg-card-hover",
          )}
        >
          <h2 className="font-heading text-heading-sm text-primary">{t("dayGroupDay1")}</h2>
          <p className="mt-2 font-body text-body-sm text-secondary">
            {t("stationsCount", { count: day1.length })}
          </p>
          <p className="mt-4 font-body text-body-xs text-muted">{t("simulationDay1Hint")}</p>
        </Link>
        <Link
          href="/osce/symulacja/2"
          className={cn(
            "rounded-card border border-border bg-card p-6 transition",
            "hover:border-brand-sage/50 hover:bg-card-hover",
          )}
        >
          <h2 className="font-heading text-heading-sm text-primary">{t("dayGroupDay2")}</h2>
          <p className="mt-2 font-body text-body-sm text-secondary">
            {t("stationsCount", { count: day2.length })}
          </p>
          <p className="mt-4 font-body text-body-xs text-muted">{t("simulationDay2Hint")}</p>
        </Link>
      </div>

      <div className="mt-14">
        <h2 className="font-heading text-heading-sm text-primary">{t("historyHeading")}</h2>
        {histErr ? (
          <div className="mt-4">
            <PrzedmiotyError message={histErr} />
            <p className="mt-2 font-body text-body-xs text-muted">
              {t("historyMigrationHint", { script: "scripts/osce-simulation-schema.sql" })}
            </p>
          </div>
        ) : histOk && histOk.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {histOk.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card px-4 py-3"
              >
                <div>
                  <p className="font-body text-body-sm text-primary">
                    {t("historyRow", {
                      day: row.examDay,
                      date: formatLocaleDate(row.completedAt, locale),
                    })}
                  </p>
                  <p className="mt-1 font-body text-body-xs text-muted">
                    {t("historyRowStats", {
                      stations: row.stationCount,
                      percent: Math.round(row.overallPercent),
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-pill px-3 py-1 font-body text-body-xs font-semibold",
                    row.passedOverall
                      ? "bg-success/15 text-success"
                      : "bg-error/15 text-error",
                  )}
                >
                  {row.passedOverall ? t("passed") : t("failed")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 font-body text-body-sm text-secondary">
            {t("noSimulationHistory")}
          </p>
        )}
      </div>

      <Link
        href="/osce"
        className="mt-10 inline-block font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
      >
        {t("backToStationList")}
      </Link>
    </div>
  );
}
