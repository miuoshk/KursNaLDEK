import type { SubjectWithProgress } from "@/features/subjects/types";
import { SubjectCard } from "@/features/subjects/components/SubjectCard";

type SubjectGridProps = {
  subjects: SubjectWithProgress[];
  isSubscribed: boolean;
};

export function SubjectGrid({ subjects, isSubscribed }: SubjectGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
      {subjects.map((subject) => {
        const isLocked = !isSubscribed;
        return (
          <SubjectCard key={subject.id} subject={subject} locked={isLocked} />
        );
      })}
    </div>
  );
}
