import Link from "next/link";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";
import { loadOsceSimulationHistory } from "@/features/osce/server/loadOsceSimulationHistory";
import { loadOsceSimulationStations } from "@/features/osce/server/loadOsceSimulationStations";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { cn } from "@/lib/utils";

function formatPlDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pl-PL", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default async function OsceSymulacjaPage() {
  const [day1, day2, history] = await Promise.all([
    loadOsceSimulationStations(1),
    loadOsceSimulationStations(2),
    loadOsceSimulationHistory(),
  ]);

  const histOk = history.ok ? history.rows : null;
  const histErr = !history.ok ? history.message : null;

  return (
    <div>
      <OsceBreadcrumbSetter second="Kurs na OSCE" third="Symulacja" />

      <h1 className="font-heading text-heading-xl text-primary">Symulacja OSCE</h1>
      <p className="mt-2 font-body text-body-md text-secondary">
        Pełna próba czasowa wg kolejności stacji. Wyniki zapisujemy w profilu.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/osce/symulacja/1"
          className={cn(
            "rounded-card border border-[color:var(--border-subtle)] bg-brand-card-1 p-6 transition",
            "hover:border-brand-sage/50 hover:bg-brand-card-2",
          )}
        >
          <h2 className="font-heading text-heading-sm text-primary">Dzień 1</h2>
          <p className="mt-2 font-body text-body-sm text-secondary">
            {day1.length}{" "}
            {day1.length === 1 ? "stacja" : day1.length >= 2 && day1.length <= 4 ? "stacje" : "stacji"}
          </p>
          <p className="mt-4 font-body text-body-xs text-muted">Rozpocznij symulację pierwszego dnia egzaminu.</p>
        </Link>
        <Link
          href="/osce/symulacja/2"
          className={cn(
            "rounded-card border border-[color:var(--border-subtle)] bg-brand-card-1 p-6 transition",
            "hover:border-brand-sage/50 hover:bg-brand-card-2",
          )}
        >
          <h2 className="font-heading text-heading-sm text-primary">Dzień 2</h2>
          <p className="mt-2 font-body text-body-sm text-secondary">
            {day2.length}{" "}
            {day2.length === 1 ? "stacja" : day2.length >= 2 && day2.length <= 4 ? "stacje" : "stacji"}
          </p>
          <p className="mt-4 font-body text-body-xs text-muted">Rozpocznij symulację drugiego dnia egzaminu.</p>
        </Link>
      </div>

      <div className="mt-14">
        <h2 className="font-heading text-heading-sm text-primary">Historia prób</h2>
        {histErr ? (
          <div className="mt-4">
            <PrzedmiotyError message={histErr} />
            <p className="mt-2 font-body text-body-xs text-muted">
              Jeśli tabela nie istnieje, uruchom migrację SQL z pliku{" "}
              <span className="font-mono">scripts/osce-simulation-schema.sql</span> w Supabase.
            </p>
          </div>
        ) : histOk && histOk.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {histOk.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-[color:var(--border-subtle)] bg-brand-card-1 px-4 py-3"
              >
                <div>
                  <p className="font-body text-body-sm text-primary">
                    Dzień {row.examDay} · {formatPlDate(row.completedAt)}
                  </p>
                  <p className="mt-1 font-body text-body-xs text-muted">
                    Stacje: {row.stationCount} · średni wynik {Math.round(row.overallPercent)}%
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
                  {row.passedOverall ? "Zdany" : "Niezdany"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 font-body text-body-sm text-secondary">
            Brak zapisanych symulacji. Ukończ pierwszą próbę, aby zobaczyć historię.
          </p>
        )}
      </div>

      <Link
        href="/osce"
        className="mt-10 inline-block font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
      >
        Wróć do listy stacji
      </Link>
    </div>
  );
}
