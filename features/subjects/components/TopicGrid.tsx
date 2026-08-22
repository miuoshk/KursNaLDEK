"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Filter } from "lucide-react";
import type { TopicWithProgress } from "@/features/subjects/server/loadSubjectDashboard";
import { TopicCard } from "@/features/subjects/components/TopicCard";
import { TopicSessionConfigDialog } from "@/features/subjects/components/TopicSessionConfigDialog";
import { formatTopicDisplayName } from "@/features/subjects/lib/topicDisplayName";
import { KnowledgeCardOverlay } from "@/features/shared/components/KnowledgeCardOverlay";
import type { SourceFilter } from "@/features/session/types";
import {
  sourceCountsFromTotals,
  topicAnsweredForSource,
  topicCountForSource,
  type SourceFilterCounts,
} from "@/features/session/lib/sourceFilter";

type TopicGridProps = {
  topics: TopicWithProgress[];
  subjectId: string;
  subjectShortName: string;
  initialSessionCount: number;
  product?: string;
  source?: SourceFilter;
  sourceEnabled?: boolean;
  subjectSourceCounts?: SourceFilterCounts | null;
};

export function TopicGrid({
  topics,
  subjectId,
  subjectShortName,
  initialSessionCount,
  product,
  source = "all",
  sourceEnabled = false,
}: TopicGridProps) {
  const t = useTranslations("subjects");
  const [selectedTopic, setSelectedTopic] = useState<TopicWithProgress | null>(null);
  const [knowledgeCardTopic, setKnowledgeCardTopic] = useState<TopicWithProgress | null>(null);

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-primary">{t("topics")}</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 font-body text-body-xs text-muted transition-colors hover:text-secondary"
        >
          <Filter className="size-3.5 shrink-0" aria-hidden />
          {t("sortByProgress")}
        </button>
      </div>

      {topics.length === 0 ? (
        <p className="mt-8 text-center font-body text-body-md text-muted">
          {t("noTopics")}
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {topics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              displayedCount={topicCountForSource(topic, source, sourceEnabled)}
              source={source}
              sourceEnabled={sourceEnabled}
              onSelect={(item) => setSelectedTopic(item)}
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
        topicName={
          selectedTopic ? formatTopicDisplayName(selectedTopic.name) : ""
        }
        totalQuestions={
          selectedTopic
            ? topicCountForSource(selectedTopic, source, sourceEnabled)
            : 0
        }
        topicCounts={
          selectedTopic && sourceEnabled
            ? sourceCountsFromTotals(
                selectedTopic.question_count,
                selectedTopic.question_count_ref ?? 0,
              )
            : null
        }
        answeredQuestions={
          selectedTopic
            ? topicAnsweredForSource(selectedTopic, source, sourceEnabled)
            : 0
        }
        initialSessionCount={initialSessionCount}
        product={product}
        source={source}
        sourceEnabled={sourceEnabled}
        hasKnowledgeCard={
          selectedTopic?.knowledge_card != null &&
          selectedTopic.knowledge_card.trim().length > 0
        }
        onOpenKnowledgeCard={() => {
          if (selectedTopic) setKnowledgeCardTopic(selectedTopic);
        }}
      />

      {knowledgeCardTopic?.knowledge_card && (
        <KnowledgeCardOverlay
          knowledgeCard={knowledgeCardTopic.knowledge_card}
          topicName={formatTopicDisplayName(knowledgeCardTopic.name)}
          onClose={() => setKnowledgeCardTopic(null)}
        />
      )}
    </section>
  );
}
