"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import type { TopicWithProgress } from "@/features/subjects/server/loadSubjectDashboard";
import { TopicCard } from "@/features/subjects/components/TopicCard";
import { TopicSessionConfigDialog } from "@/features/subjects/components/TopicSessionConfigDialog";

type TopicGridProps = {
  topics: TopicWithProgress[];
  subjectId: string;
  subjectShortName: string;
};

export function TopicGrid({ topics, subjectId, subjectShortName }: TopicGridProps) {
  const [selectedTopic, setSelectedTopic] = useState<TopicWithProgress | null>(null);

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
            <TopicCard
              key={topic.id}
              topic={topic}
              onSelect={(t) => setSelectedTopic(t)}
            />
          ))}
        </div>
      )}

      <TopicSessionConfigDialog
        open={selectedTopic !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTopic(null);
        }}
        subjectId={subjectId}
        subjectShortName={subjectShortName}
        topicId={selectedTopic?.id ?? ""}
        topicName={selectedTopic?.name ?? ""}
        totalQuestions={selectedTopic?.question_count ?? 0}
        answeredQuestions={selectedTopic?.answered_count ?? 0}
        hasKnowledgeCard={
          selectedTopic?.knowledge_card != null &&
          selectedTopic.knowledge_card.trim().length > 0
        }
      />
    </section>
  );
}
