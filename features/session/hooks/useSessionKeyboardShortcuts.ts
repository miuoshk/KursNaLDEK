"use client";

import { useEffect } from "react";
import type { SessionQuestion } from "@/features/session/types";

type Args = {
  currentQuestion: SessionQuestion | null;
  currentIndex: number;
  isShowingFeedback: boolean;
  isPastReadOnly: boolean;
  selectedOptionId: string | null;
  confidence: unknown;
  selectOption: (id: string) => void;
  onCheck: () => void;
  onGoPrevious: () => void;
  onGoNext: () => void;
};

export function useSessionKeyboardShortcuts({
  currentQuestion,
  currentIndex,
  isShowingFeedback,
  isPastReadOnly,
  selectedOptionId,
  confidence,
  selectOption,
  onCheck,
  onGoPrevious,
  onGoNext,
}: Args) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const opts = currentQuestion?.options;
      const canGoNext =
        isPastReadOnly ||
        (Boolean(isShowingFeedback && selectedOptionId && confidence !== null));

      if (e.key === "ArrowLeft" && currentIndex > 0 && !isShowingFeedback) {
        e.preventDefault();
        onGoPrevious();
        return;
      }
      if (e.key === "ArrowRight" && canGoNext) {
        e.preventDefault();
        onGoNext();
        return;
      }

      if (!opts?.length || isShowingFeedback) return;
      const k = e.key;
      if (k >= "1" && k <= "9") {
        const idx = Number(k) - 1;
        const opt = opts[idx];
        if (opt) {
          e.preventDefault();
          selectOption(opt.id);
        }
      }
      if (k === "Enter" && selectedOptionId) {
        e.preventDefault();
        onCheck();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    currentQuestion,
    currentIndex,
    isShowingFeedback,
    isPastReadOnly,
    selectedOptionId,
    confidence,
    selectOption,
    onCheck,
    onGoPrevious,
    onGoNext,
  ]);
}
