import Link from "next/link";
import { loadKnnpSubjectsData } from "@/features/subjects/server/loadKnnpSubjects";

export default async function SesjaChoicePage() {
  const res = await loadKnnpSubjectsData();
  if (!res.ok) {
    return (
      <div className="font-body text-body-md text-secondary">
        <p>{res.message}</p>
      </div>
    );
  }

  const { subjects } = res;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-heading-xl text-primary">Sesja nauki</h1>
        <p className="mt-2 font-body text-body-md text-secondary">
          Wybierz przedmiot i rozpocznij
        </p>
      </header>

      <ul className="space-y-4">
        {subjects.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-4 rounded-card bg-brand-card-1 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-heading text-heading-sm text-primary">{s.name}</p>
              <p className="mt-1 font-body text-body-sm text-secondary">
                {s.question_count} pytań · {s.mastery_percentage}% opanowania
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/sesja/new?subject=${encodeURIComponent(s.id)}&mode=nauka&count=10`}
                className="inline-flex rounded-btn bg-brand-gold px-4 py-2 font-body text-body-sm font-semibold text-brand-bg transition hover:brightness-110"
              >
                Rozpocznij →
              </Link>
              <Link
                href={`/przedmioty/${encodeURIComponent(s.id)}`}
                className="inline-flex rounded-btn border border-[color:var(--border-subtle)] px-4 py-2 font-body text-body-sm text-secondary transition hover:text-white"
              >
                Szczegóły
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <section className="rounded-card border-l-[3px] border-brand-gold bg-brand-card-1 p-6">
        <h2 className="font-heading text-heading-md text-primary">Szybka sesja — wszystkie przedmioty</h2>
        <p className="mt-2 font-body text-body-sm text-secondary">
          Algorytm dobierze pytania z różnych przedmiotów.
        </p>
        <Link
          href="/sesja/new?mode=nauka&count=10"
          className="mt-4 inline-flex rounded-btn bg-brand-gold px-5 py-2.5 font-body font-semibold text-brand-bg transition hover:brightness-110"
        >
          Rozpocznij →
        </Link>
      </section>
    </div>
  );
}
