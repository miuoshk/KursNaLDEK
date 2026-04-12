"use client";

import { BookOpen } from "lucide-react";

import { markdownBlock } from "@/features/osce/lib/markdownBlock";

export type TopicSessionIntroProps = {
  knowledgeCard: string | null;
  onStart: () => void;
};

export function TopicSessionIntro({ knowledgeCard, onStart }: TopicSessionIntroProps) {
  const trimmedKnowledgeCard = knowledgeCard?.trim() ?? null;
  const knowledgeCardContent = trimmedKnowledgeCard ?? "";
  const hasKnowledgeCard = knowledgeCardContent.length > 0;

  return (
    <div className="rounded-card border border-border bg-card p-6">
      <h2 className="font-heading text-heading-sm text-primary">Karta wiedzy</h2>
      {hasKnowledgeCard ? (
        <div className="mt-4">{markdownBlock(knowledgeCardContent)}</div>
      ) : (
        <div className="mt-4 rounded-xl border border-[#367368]/10 bg-[#367368]/5 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#367368]/10">
            <BookOpen className="h-5 w-5 text-[#367368]" aria-hidden />
          </div>
          <p className="mt-4 font-body text-body-md font-medium text-primary">
            Karta wiedzy jest w przygotowaniu
          </p>
          <p className="mt-2 font-body text-body-sm text-secondary">
            W międzyczasie możesz przećwiczyć pytania — to najlepszy sposób nauki.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-6 rounded-lg bg-[#C9A84C] px-6 py-2.5 font-body font-medium text-[#002A27] transition duration-200 ease-out hover:brightness-110"
          >
            Przejdź do pytań →
          </button>
        </div>
      )}
      {hasKnowledgeCard ? (
        <button
          type="button"
          onClick={onStart}
          className="mt-8 rounded-lg bg-[#C9A84C] px-6 py-2.5 font-body font-medium text-[#002A27] transition duration-200 ease-out hover:brightness-110"
        >
          Rozumiem, przejdź do pytań
        </button>
      ) : null}
    </div>
  );
}
