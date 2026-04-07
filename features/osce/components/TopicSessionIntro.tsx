"use client";

import { markdownBlock } from "@/features/osce/lib/markdownBlock";

export type TopicSessionIntroProps = {
  knowledgeCard: string | null;
  onStart: () => void;
};

export function TopicSessionIntro({ knowledgeCard, onStart }: TopicSessionIntroProps) {
  return (
    <div className="rounded-card border border-[color:var(--border-subtle)] bg-brand-card-1 p-6">
      <h2 className="font-heading text-heading-sm text-primary">Karta wiedzy</h2>
      {knowledgeCard && knowledgeCard.trim().length > 0 ? (
        <div className="mt-4">{markdownBlock(knowledgeCard)}</div>
      ) : (
        <p className="mt-4 font-body text-body-sm text-secondary">
          Brak karty wiedzy dla tego tematu. Możesz od razu przejść do pytań.
        </p>
      )}
      <button
        type="button"
        onClick={onStart}
        className="mt-8 w-full rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110 sm:w-auto"
      >
        Rozumiem, przejdź do pytań
      </button>
    </div>
  );
}
