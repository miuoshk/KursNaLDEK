"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { TopicWithProgress } from "@/features/subjects/server/loadSubjectDashboard";
import { KnowledgeCardOverlay } from "@/features/shared/components/KnowledgeCardOverlay";
import { cn } from "@/lib/utils";

type TopicCardProps = {
  topic: TopicWithProgress;
  subjectId: string;
};

function fillClassForProgress(pct: number) {
  if (pct < 40) return "bg-error";
  if (pct <= 75) return "bg-brand-gold";
  return "bg-success";
}

export function TopicCard({ topic, subjectId }: TopicCardProps) {
  const [showCard, setShowCard] = useState(false);

  const total = topic.question_count;
  const answered = topic.answered_count;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  const hasQuestions = total > 0;
  const hasKnowledgeCard =
    topic.knowledge_card != null && topic.knowledge_card.trim().length > 0;

  const href = `/sesja/new?subject=${encodeURIComponent(subjectId)}&topic=${encodeURIComponent(topic.id)}&mode=inteligentna&count=50`;

  const inner = (
    <>
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 font-heading text-body-md text-primary">
          {topic.name}
        </h3>
        {!hasQuestions && (
          <span className="font-body text-body-xs text-brand-gold">
            Wkrótce
          </span>
        )}
        {hasKnowledgeCard && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCard(true);
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-sage/30 text-brand-sage transition-colors duration-200 ease-out hover:bg-brand-sage/10"
            aria-label="Karta wiedzy"
            title="Karta wiedzy"
          >
            <BookOpen className="size-4" aria-hidden />
          </button>
        )}
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            fillClassForProgress(pct),
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 font-body text-body-xs text-muted">
        {hasQuestions ? `${answered} / ${total} pytań` : "Brak pytań"}
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="font-body text-body-xs text-muted">Ostatnio: —</p>
        <span
          className={cn(
            "inline-flex items-center rounded-lg border px-3 py-1 font-body text-body-sm font-medium transition-colors duration-200 ease-out",
            hasQuestions
              ? "border-brand-sage/40 text-brand-sage group-hover:bg-brand-sage/10"
              : "border-transparent text-muted",
          )}
        >
          {hasQuestions ? "Rozpocznij" : "Wkrótce"}
        </span>
      </div>
    </>
  );

  if (!hasQuestions) {
    return (
      <div className="rounded-card border border-border bg-card p-5 opacity-50">
        {inner}
      </div>
    );
  }

  return (
    <>
      <Link
        href={href}
        className={cn(
          "group block rounded-card border border-border bg-card p-5",
          "transition-all duration-200 ease-out hover:border-brand-sage/30",
        )}
      >
        {inner}
      </Link>
      {showCard && hasKnowledgeCard && (
        <KnowledgeCardOverlay
          knowledgeCard={topic.knowledge_card!}
          topicName={topic.name}
          onClose={() => setShowCard(false)}
        />
      )}
    </>
  );
}
