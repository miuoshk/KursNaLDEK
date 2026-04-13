"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";

type KnowledgeCardOverlayProps = {
  knowledgeCard: string;
  topicName: string;
  onClose: () => void;
};

export function KnowledgeCardOverlay({
  knowledgeCard,
  topicName,
  onClose,
}: KnowledgeCardOverlayProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-label="Karta wiedzy"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-card border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-heading-sm text-primary">
              Karta wiedzy
            </h2>
            <p className="mt-1 font-body text-body-sm text-muted">
              {topicName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn border border-white/[0.12] text-secondary transition-colors hover:bg-white/[0.06]"
            aria-label="Zamknij"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="mt-4">{markdownBlock(knowledgeCard)}</div>
      </div>
    </div>
  );
}
