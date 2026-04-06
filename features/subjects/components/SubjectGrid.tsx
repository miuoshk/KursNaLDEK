import type { SubjectWithProgress } from "@/features/subjects/types";
import { SubjectCard } from "@/features/subjects/components/SubjectCard";

type SubjectGridProps = {
  subjects: SubjectWithProgress[];
};

export function SubjectGrid({ subjects }: SubjectGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {subjects.map((subject) => (
        <SubjectCard key={subject.id} subject={subject} />
      ))}
    </div>
  );
}
