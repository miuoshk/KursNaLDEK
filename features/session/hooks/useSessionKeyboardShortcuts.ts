"use client";

import { useEffect } from "react";
import type { Confidence } from "@/features/session/types";
import type { SessionQuestion } from "@/features/session/types";

type Args = {
  currentQuestion: SessionQuestion | null;
  currentIndex: number;
  isShowingFeedback: boolean;
  isPastReadOnly: boolean;
  selectedOptionId: string | null;
  selectOption: (id: string) => void;
  onCheck: () => void;
  onGoPrevious: () => void;
  onConfidencePick: (c: Confidence) => void;
  onContinueReview: () => void;
};

export function useSessionKeyboardShortcuts({
  currentQuestion,
  currentIndex,
  isShowingFeedback,
  isPastReadOnly,
  selectedOptionId,
  selectOption,
  onCheck,
  onGoPrevious,
  onConfidencePick,
  onContinueReview,
}: Args) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (isShowingFeedback) {
        if (isPastReadOnly) {
          if (e.key === "ArrowRight" || e.key === "Enter") {
            e.preventDefault();
            onContinueReview();
          }
          return;
        }
        if (e.key === "1" || e.key === "ArrowLeft") {
          e.preventDefault();
          onConfidencePick("nie_wiedzialem");
          return;
        }
        if (e.key === "2" || e.key === "ArrowDown") {
          e.preventDefault();
          onConfidencePick("troche");
          return;
        }
        if (e.key === "3" || e.key === "ArrowRight") {
          e.preventDefault();
          onConfidencePick("na_pewno");
          return;
        }
        return;
      }

      if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        onGoPrevious();
        return;
      }

      const opts = currentQuestion?.options;
      if (!opts?.length) return;
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
    selectOption,
    onCheck,
    onGoPrevious,
    onConfidencePick,
    onContinueReview,
  ]);
}
