"use client";

import { useEffect, useMemo } from "react";
import type { Confidence, SessionQuestion } from "@/features/session/types";
import { orderSessionOptions } from "@/features/session/lib/sessionOptionOrder";

type Args = {
  currentQuestion: SessionQuestion | null;
  currentIndex: number;
  total: number;
  isShowingFeedback: boolean;
  isCurrentAnswered: boolean;
  isWaitingForConfidence: boolean;
  isPrzeglad: boolean;
  selectAndCheck: (optionId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onConfidencePick: (c: Confidence) => void;
};

export function useSessionKeyboardShortcuts({
  currentQuestion,
  currentIndex,
  total,
  isShowingFeedback,
  isCurrentAnswered,
  isWaitingForConfidence,
  isPrzeglad,
  selectAndCheck,
  onNext,
  onPrevious,
  onConfidencePick,
}: Args) {
  const displayOptions = useMemo(
    () =>
      currentQuestion
        ? orderSessionOptions(
            currentQuestion.id,
            currentQuestion.options,
            currentQuestion.disableOptionShuffle,
          )
        : [],
    [currentQuestion],
  );

  useEffect(() => {
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        onPrevious();
        return;
      }

      if (isWaitingForConfidence && !isPrzeglad) {
        if (e.key === "1") { e.preventDefault(); onConfidencePick("nie_wiedzialem"); return; }
        if (e.key === "2") { e.preventDefault(); onConfidencePick("troche"); return; }
        if (e.key === "3") { e.preventDefault(); onConfidencePick("na_pewno"); return; }
        return;
      }

      if (e.key === "ArrowRight") {
        if (currentIndex >= total - 1 && !(isShowingFeedback || isCurrentAnswered)) {
          // Na ostatnim pytaniu bez odpowiedzi nie pomijamy — niech użytkownik wybierze albo zakończy świadomie.
          return;
        }
        e.preventDefault();
        onNext();
        return;
      }

      if (e.key === "Enter") {
        if (isShowingFeedback || isCurrentAnswered) {
          e.preventDefault();
          onNext();
          return;
        }
      }

      if (!isShowingFeedback && !isCurrentAnswered) {
        if (!displayOptions.length) return;
        const k = e.key;
        if (k >= "1" && k <= "9") {
          const idx = Number(k) - 1;
          const opt = displayOptions[idx];
          if (opt) {
            e.preventDefault();
            selectAndCheck(opt.id);
          }
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    displayOptions,
    currentIndex,
    total,
    isShowingFeedback,
    isCurrentAnswered,
    isWaitingForConfidence,
    isPrzeglad,
    selectAndCheck,
    onNext,
    onPrevious,
    onConfidencePick,
  ]);
}
