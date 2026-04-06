"use client";

import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Confidence } from "@/features/session/types";

type SessionConfidenceBarProps = {
  current: number;
  total: number;
  isPastReadOnly: boolean;
  canGoPrevious: boolean;
  onGoPrevious: () => void;
  onConfidence: (c: Confidence) => void;
  onContinueReview: () => void;
};

export function SessionConfidenceBar({
  current,
  total,
  isPastReadOnly,
  canGoPrevious,
  onGoPrevious,
  onConfidence,
  onContinueReview,
}: SessionConfidenceBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(255,255,255,0.06)] bg-brand-bg/95 px-4 py-3 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {canGoPrevious ? (
            <button
              type="button"
              onClick={onGoPrevious}
              className="inline-flex shrink-0 items-center gap-1 font-body text-body-sm text-secondary transition-colors hover:text-white"
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              Poprzednie
            </button>
          ) : (
            <span className="w-[7.5rem] shrink-0" aria-hidden />
          )}
          <p className="font-mono text-body-xs text-secondary">
            Pytanie {current + 1} / {total}
          </p>
        </div>

        <div className="flex flex-1 justify-center gap-1.5 sm:justify-center">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={cn(
                "size-2 rounded-full transition-colors duration-200",
                i < current ? "bg-brand-gold/80" : i === current ? "bg-brand-gold" : "bg-white/10",
              )}
              aria-hidden
            />
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-none sm:flex-row sm:justify-end">
          {isPastReadOnly ? (
            <button
              type="button"
              onClick={onContinueReview}
              className="w-full rounded-btn bg-brand-gold px-4 py-2.5 font-body text-body-sm font-semibold text-brand-bg transition hover:brightness-110 sm:w-auto"
            >
              Dalej
            </button>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onConfidence("nie_wiedzialem")}
                className="rounded-btn border border-error/20 bg-error/[0.08] px-3 py-2.5 font-body text-body-xs font-medium text-error transition hover:border-error/40 hover:bg-error/[0.15] sm:text-body-sm"
              >
                Nie wiedziałem
              </button>
              <button
                type="button"
                onClick={() => onConfidence("troche")}
                className="rounded-btn border border-brand-gold/20 bg-brand-gold/[0.08] px-3 py-2.5 font-body text-body-xs font-medium text-brand-gold transition hover:border-brand-gold/40 hover:bg-brand-gold/[0.15] sm:text-body-sm"
              >
                Trochę wiedziałem
              </button>
              <button
                type="button"
                onClick={() => onConfidence("na_pewno")}
                className="rounded-btn border border-success/20 bg-success/[0.08] px-3 py-2.5 font-body text-body-xs font-medium text-success transition hover:border-success/40 hover:bg-success/[0.15] sm:text-body-sm"
              >
                Wiedziałem na pewno
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
