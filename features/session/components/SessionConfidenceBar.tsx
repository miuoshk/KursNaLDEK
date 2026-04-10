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
  disabled?: boolean;
};

export function SessionConfidenceBar({
  current,
  total,
  isPastReadOnly,
  canGoPrevious,
  onGoPrevious,
  onConfidence,
  onContinueReview,
  disabled,
}: SessionConfidenceBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {isPastReadOnly ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {canGoPrevious && (
                <button
                  type="button"
                  onClick={onGoPrevious}
                  className="inline-flex shrink-0 items-center gap-1 font-body text-body-sm text-secondary transition-colors hover:text-primary"
                >
                  <ChevronLeft className="size-4 shrink-0" aria-hidden />
                  Poprzednie
                </button>
              )}
              <p className="font-body text-body-xs text-secondary">
                Pytanie {current + 1} / {total}
              </p>
            </div>
            <button
              type="button"
              onClick={onContinueReview}
              className="rounded-btn bg-brand-gold px-4 py-2.5 font-body text-body-sm font-semibold text-brand-bg transition hover:brightness-110"
            >
              Dalej
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <p className="font-body text-body-xs text-secondary">Jak dobrze znałeś odpowiedź?</p>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onConfidence("nie_wiedzialem")}
                  className="flex-1 rounded-btn border border-error/20 bg-error/[0.08] px-3 py-2.5 font-body text-body-xs font-medium text-error transition hover:border-error/40 hover:bg-error/[0.15] disabled:cursor-not-allowed disabled:opacity-50 sm:text-body-sm"
                >
                  Nie wiedziałem
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onConfidence("troche")}
                  className="flex-1 rounded-btn border border-brand-gold/20 bg-brand-gold/[0.08] px-3 py-2.5 font-body text-body-xs font-medium text-brand-gold transition hover:border-brand-gold/40 hover:bg-brand-gold/[0.15] disabled:cursor-not-allowed disabled:opacity-50 sm:text-body-sm"
                >
                  {disabled ? "Zapisywanie..." : "Trochę wiedziałem"}
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onConfidence("na_pewno")}
                  className="flex-1 rounded-btn border border-success/20 bg-success/[0.08] px-3 py-2.5 font-body text-body-xs font-medium text-success transition hover:border-success/40 hover:bg-success/[0.15] disabled:cursor-not-allowed disabled:opacity-50 sm:text-body-sm"
                >
                  Wiedziałem na pewno
                </button>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onConfidence("troche")}
                className="font-body text-body-xs text-muted transition-colors hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Pomiń ocenę
              </button>
            </div>
          </>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {!isPastReadOnly && canGoPrevious && (
              <button
                type="button"
                onClick={onGoPrevious}
                className="inline-flex shrink-0 items-center gap-1 font-body text-body-sm text-secondary transition-colors hover:text-primary"
              >
                <ChevronLeft className="size-4 shrink-0" aria-hidden />
                Poprzednie
              </button>
            )}
            <p className="font-body text-body-xs text-secondary">
              Pytanie {current + 1} / {total}
            </p>
          </div>
          <div className="flex gap-1.5">
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
        </div>
      </div>
    </div>
  );
}
