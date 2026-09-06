"use client";

import { useLayoutEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Confidence } from "@/features/session/types";
import type { SessionBottomBarMode } from "@/features/session/lib/sessionBottomBar";
import { cn } from "@/lib/utils";

type SessionBottomBarProps = {
  mode: SessionBottomBarMode;
  questionId: string;
  submitting?: boolean;
  nextLabel: string;
  onConfidencePick: (c: Confidence) => void;
  onNext: () => void;
  onConfidenceBarShown?: (questionId: string) => void;
};

const slideTransition = { duration: 0.15, ease: "easeOut" as const };

export function SessionBottomBar({
  mode,
  questionId,
  submitting,
  nextLabel,
  onConfidencePick,
  onNext,
  onConfidenceBarShown,
}: SessionBottomBarProps) {
  const t = useTranslations("session");
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    if (mode !== "confidence") return;
    onConfidenceBarShown?.(questionId);
  }, [mode, questionId, onConfidenceBarShown]);

  return (
    <AnimatePresence initial={false}>
      {mode === "hidden" ? null : (
        <motion.div
          key="session-bottom-bar"
          initial={reduceMotion ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: 12, opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : slideTransition}
          className="px-3 py-2 sm:px-4"
          data-session-bottom-bar={mode}
        >
          <div className="mx-auto w-full max-w-3xl">
            {mode === "confidence" ? (
              <div className="flex min-h-14 flex-col justify-center gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-body text-body-xs text-secondary">
                    {t("howSureAreYouShort")}
                  </p>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onConfidencePick("troche")}
                    className="shrink-0 font-body text-body-xs text-muted transition-colors hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("skip")}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onConfidencePick("nie_wiedzialem")}
                    className="min-h-11 rounded-btn border border-error/20 bg-error/[0.08] px-2 font-body text-body-xs font-medium text-error transition hover:border-error/40 hover:bg-error/[0.15] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("didNotKnow")}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onConfidencePick("troche")}
                    className="min-h-11 rounded-btn border border-brand-gold/20 bg-brand-gold/[0.08] px-2 font-body text-body-xs font-medium text-brand-gold transition hover:border-brand-gold/40 hover:bg-brand-gold/[0.15] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? t("saving") : t("knewSomewhatShort")}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onConfidencePick("na_pewno")}
                    className="min-h-11 rounded-btn border border-success/20 bg-success/[0.08] px-2 font-body text-body-xs font-medium text-success transition hover:border-success/40 hover:bg-success/[0.15] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("knewForSureShort")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-14 items-center">
                <button
                  type="button"
                  onClick={onNext}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-center rounded-btn border border-brand-gold/40 bg-brand-gold/10 px-4 font-body text-body-sm font-semibold text-brand-gold transition-colors",
                    "hover:border-brand-gold hover:bg-brand-gold/15",
                  )}
                >
                  {nextLabel}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
