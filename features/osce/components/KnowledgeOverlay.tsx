"use client";

import { markdownBlock } from "@/features/osce/lib/markdownBlock";

export type KnowledgeOverlayProps = {
  knowledgeCard: string | null;
  onClose: () => void;
};

export function KnowledgeOverlay({ knowledgeCard, onClose }: KnowledgeOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-label="Karta wiedzy"
    >
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-card border border-border bg-background p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-heading-sm text-primary">Karta wiedzy</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn border border-white/[0.12] px-3 py-1.5 font-body text-body-sm text-secondary hover:bg-white/[0.06]"
          >
            Zamknij
          </button>
        </div>
        <div className="mt-4">
          {knowledgeCard && knowledgeCard.trim().length > 0 ? (
            markdownBlock(knowledgeCard)
          ) : (
            <p className="font-body text-body-sm text-secondary">
              Brak karty wiedzy dla tego tematu.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
