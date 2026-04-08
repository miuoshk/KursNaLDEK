import { OverallProgress } from "@/features/subjects/components/OverallProgress";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { SubjectGrid } from "@/features/subjects/components/SubjectGrid";
import { loadKnnpSubjectsData } from "@/features/subjects/server/loadKnnpSubjects";

export default async function PrzedmiotyPage() {
  const result = await loadKnnpSubjectsData();

  if (!result.ok) {
    return (
      <div>
        <h1 className="font-heading text-heading-xl text-primary">Moje przedmioty</h1>
        <div className="mt-8">
          <PrzedmiotyError message={result.message} />
        </div>
      </div>
    );
  }

  const { subjects, profile, totalQuestionCount, isSubscribed } = result;

  return (
    <div>
      <h1 className="font-heading text-heading-xl text-primary">Moje przedmioty</h1>
      <p className="mt-2 font-body text-body-md text-secondary">
        Rok {profile.current_year} · {profile.track}
      </p>

      <div className="mt-8 space-y-8">
        <OverallProgress year={profile.current_year} totalQuestions={totalQuestionCount} />
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
