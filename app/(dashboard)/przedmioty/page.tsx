import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { OverallProgress } from "@/features/subjects/components/OverallProgress";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { SubjectGrid } from "@/features/subjects/components/SubjectGrid";
import { loadKnnpSubjectsData } from "@/features/subjects/server/loadKnnpSubjects";

export default async function PrzedmiotyPage() {
  const result = await loadKnnpSubjectsData();

  if (!result.ok) {
    return (
      <div>
        <h1 className="font-heading text-3xl font-bold text-primary">Moje przedmioty</h1>
        <div className="mt-8">
          <PrzedmiotyError message={result.message} />
        </div>
      </div>
    );
  }

  const { subjects, profile, totalQuestionCount, overallProgress, isSubscribed } = result;

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-primary">Moje przedmioty</h1>
      <p className="mt-2 font-body text-lg text-secondary">
        Rok {profile.current_year} · {profile.track}
      </p>

      <div className="mt-8 space-y-8">
        <OverallProgress
          year={profile.current_year}
          totalQuestions={totalQuestionCount}
          answered={overallProgress.answered}
          mastered={overallProgress.mastered}
          reviewing={overallProgress.reviewing}
        />

        <section>
          <h2 className="font-heading text-xl text-[#C9A84C]">Egzamin praktyczny OSCE</h2>
          <p className="mt-2 font-body text-sm text-secondary">
            7 stacji · 14 zadań · próg zaliczenia: 60% na stację
          </p>
          <div className="mt-4">
            <Link
              href="/osce"
              className="group flex w-full items-start gap-4 rounded-2xl border border-[#C9A84C]/30 bg-[#002A27] p-6 transition-all duration-200 ease-out hover:border-[#C9A84C]/50"
            >
              <Stethoscope
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

        <div className="pt-2">
          <h2 className="text-sm uppercase tracking-widest text-white/60">Nauki podstawowe</h2>
        </div>

        {subjects.length === 0 ? (
          <p className="font-body text-body-md text-secondary">
            Brak przedmiotów do wyświetlenia. Skontaktuj się z administratorem lub spróbuj później.
          </p>
        ) : (
          <SubjectGrid subjects={subjects} isSubscribed={isSubscribed} />
        )}
      </div>
    </div>
  );
}
