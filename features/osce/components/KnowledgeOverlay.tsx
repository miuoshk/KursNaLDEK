"use client";

import { useTranslations } from "next-intl";

import { markdownBlock } from "@/features/osce/lib/markdownBlock";

export type KnowledgeOverlayProps = {
  knowledgeCard: string | null;
  onClose: () => void;
};

export function KnowledgeOverlay({ knowledgeCard, onClose }: KnowledgeOverlayProps) {
  const t = useTranslations("osce");
  const tCommon = useTranslations("common");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-label={t("knowledgeCard")}
    >
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-card border border-border bg-background p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-heading-sm text-primary">{t("knowledgeCard")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn border border-white/[0.12] px-3 py-1.5 font-body text-body-sm text-secondary hover:bg-white/[0.06]"
          >
            {tCommon("close")}
          </button>
        </div>
        <div className="mt-4">
          {knowledgeCard && knowledgeCard.trim().length > 0 ? (
            markdownBlock(knowledgeCard)
          ) : (
            <p className="font-body text-body-sm text-secondary">
              {t("noKnowledgeCard")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
