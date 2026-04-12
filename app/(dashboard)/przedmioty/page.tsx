import Link from "next/link";
import { Stethoscope, ChevronRight } from "lucide-react";
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
        {subjects.length === 0 ? (
          <p className="font-body text-body-md text-secondary">
            Brak przedmiotów do wyświetlenia. Skontaktuj się z administratorem lub spróbuj później.
          </p>
        ) : (
          <SubjectGrid subjects={subjects} isSubscribed={isSubscribed} />
        )}

        <section className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-primary">Egzamin praktyczny</h2>
          <div className="mt-4">
            <Link
              href="/osce"
              className="group flex items-center gap-4 rounded-card border border-border bg-card p-5 transition-all duration-200 ease-out hover:border-brand-sage/30"
            >
              <Stethoscope
                className="size-5 shrink-0 text-secondary transition-colors duration-200 group-hover:text-brand-sage"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-body-lg text-primary">OSCE</h3>
                <p className="mt-1 font-body text-body-sm text-muted">
                  Stacje, tematy i symulacje egzaminu praktycznego
                </p>
              </div>
              <ChevronRight
                className="size-5 shrink-0 text-secondary transition-colors duration-200 group-hover:text-brand-sage"
                aria-hidden
              />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
