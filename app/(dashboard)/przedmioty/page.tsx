import Link from "next/link";
import { SmilePlus } from "lucide-react";
import { OverallProgress } from "@/features/subjects/components/OverallProgress";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { SubjectGrid } from "@/features/subjects/components/SubjectGrid";
import { loadKnnpSubjectsData } from "@/features/subjects/server/loadKnnpSubjects";
import { requireCurrentSelectionAccessOrRedirect } from "@/features/access/server/guards";

export default async function PrzedmiotyPage() {
  await requireCurrentSelectionAccessOrRedirect();
  const result = await loadKnnpSubjectsData();

  if (!result.ok) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          Moje przedmioty
        </h1>
        <div className="mt-8">
          <PrzedmiotyError message={result.message} />
        </div>
      </div>
    );
  }

  const { subjects, profile, totalQuestionCount, overallProgress, isSubscribed } = result;
  const showOsceSection = profile.track === "Stomatologia" && profile.current_year === 2;

  return (
    <div>
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          Moje przedmioty
        </h1>
        <p className="mt-1 font-body text-sm text-secondary">
          Rok {profile.current_year} · {profile.track}
        </p>
      </header>

      <div className="mt-8 space-y-8">
        <OverallProgress
          year={profile.current_year}
          totalQuestions={totalQuestionCount}
          answered={overallProgress.answered}
          mastered={overallProgress.mastered}
          reviewing={overallProgress.reviewing}
        />

        {showOsceSection ? (
          <section>
            <h2 className="font-heading text-xl font-bold text-brand-gold">
              Egzamin praktyczny OSCE
            </h2>
            <p className="mt-1 font-body text-sm text-secondary">
              7 stacji · 14 zadań · próg zaliczenia: 60% na stację
            </p>
            <div className="mt-4">
              <Link
                href="/osce"
                className="group flex w-full items-start gap-4 rounded-2xl border border-[#C9A84C]/30 bg-[#002A27] p-6 transition-all duration-200 ease-out hover:border-[#C9A84C]/50"
              >
                <SmilePlus
                  className="h-8 w-8 shrink-0 text-[#C9A84C]"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-base text-primary">
                    Kurs na OSCE — Stacje, tematy i symulacje egzaminu praktycznego
                  </p>
                  <p className="mt-3 inline-flex rounded-full bg-[#367368]/20 px-3 py-1 font-body text-xs text-[#367368]">
                    Dzień 1: 3 stacje · Dzień 2: 4 stacje
                  </p>
                </div>
              </Link>
            </div>
          </section>
        ) : null}

        {showOsceSection ? (
          <h2 className="font-heading text-xl font-bold text-primary">
            Nauki podstawowe
          </h2>
        ) : null}

        {subjects.length === 0 ? (
          <p className="font-body text-body-md text-secondary">
            Brak przedmiotów do wyświetlenia. Skontaktuj się z administratorem lub spróbuj później.
          </p>
        ) : (
          <SubjectGrid subjects={subjects} isSubscribed={isSubscribed} />
        )}

        {!isSubscribed ? (
          <div className="rounded-card border border-brand-gold/30 bg-brand-gold/10 p-4">
            <p className="font-body text-body-sm text-brand-gold">
              Ten rok nie jest jeszcze aktywny. Wybierz opcję i opłać dostęp w panelu wyboru roku.
            </p>
            <Link
              href="/wybor-roku"
              className="mt-3 inline-flex rounded-btn border border-brand-gold/40 px-4 py-2 font-body text-body-sm text-brand-gold transition hover:bg-brand-gold/10"
            >
              Przejdź do wyboru roku
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
