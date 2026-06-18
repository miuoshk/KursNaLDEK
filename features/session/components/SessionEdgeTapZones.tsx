"use client";

import { useTranslations } from "next-intl";

type SessionEdgeTapZonesProps = {
  active: boolean;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

/**
 * Niewidoczne strefy na skrajach obszaru treści — tap przechodzi do poprzedniego / następnego pytania.
 * Wymaga rodzica z `position: relative` (nie fixed na viewport — nie zasłania sidebara ani nagłówków).
 */
export function SessionEdgeTapZones({
  active,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
}: SessionEdgeTapZonesProps) {
  const t = useTranslations("session");

  if (!active) return null;

  return (
    <>
      <button
        type="button"
        className="absolute bottom-0 left-0 top-0 z-10 w-[min(14vw,72px)] cursor-default border-0 bg-transparent p-0 opacity-0 disabled:pointer-events-none"
        aria-label={t("previousQuestionAria")}
        disabled={!canPrevious}
        onClick={onPrevious}
      />
      <button
        type="button"
        className="absolute bottom-0 right-0 top-0 z-10 w-[min(14vw,72px)] cursor-default border-0 bg-transparent p-0 opacity-0 disabled:pointer-events-none"
        aria-label={t("nextQuestionAria")}
        disabled={!canNext}
        onClick={onNext}
      />
    </>
  );
}
