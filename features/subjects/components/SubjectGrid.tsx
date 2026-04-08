import type { SubjectWithProgress } from "@/features/subjects/types";
import { SubjectCard } from "@/features/subjects/components/SubjectCard";

type SubjectGridProps = {
  subjects: SubjectWithProgress[];
  isSubscribed: boolean;
};

export function SubjectGrid({ subjects, isSubscribed }: SubjectGridProps) {
  const years = [...new Set(subjects.map((s) => s.year))].sort((a, b) => a - b);

  return (
    <div className="space-y-10">
      {years.map((year) => {
        const yearSubjects = subjects.filter((s) => s.year === year);
        return (
          <section key={year}>
            <h2 className="mb-4 font-heading text-heading-sm text-secondary">
              Rok {year}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {yearSubjects.map((subject) => {
                const isLocked = !isSubscribed && subject.display_order !== 1;
                return (
                  <SubjectCard key={subject.id} subject={subject} locked={isLocked} />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
