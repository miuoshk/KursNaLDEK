import { Filter } from "lucide-react";
import type { Topic } from "@/features/subjects/types";
import { TopicCard } from "@/features/subjects/components/TopicCard";

type TopicGridProps = {
  topics: Topic[];
  subjectId: string;
};

export function TopicGrid({ topics, subjectId }: TopicGridProps) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-heading text-heading-sm text-primary">Tematy</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 font-body text-body-xs text-muted transition-colors hover:text-secondary"
        >
          <Filter className="size-3.5 shrink-0" aria-hidden />
          Sortuj według postępu
        </button>
      </div>

      {topics.length === 0 ? (
        <p className="mt-8 text-center font-body text-body-md text-muted">
          Brak tematów. Tematy zostaną dodane wkrótce.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} subjectId={subjectId} />
          ))}
        </div>
      )}
    </section>
  );
}
