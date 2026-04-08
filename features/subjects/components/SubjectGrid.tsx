import type { SubjectWithProgress } from "@/features/subjects/types";
import { SubjectCard } from "@/features/subjects/components/SubjectCard";

type SubjectGridProps = {
  subjects: SubjectWithProgress[];
};

export function SubjectGrid({ subjects }: SubjectGridProps) {
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
              {yearSubjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
