"use client";

import { useEffect, useMemo } from "react";
import { resolveSessionShortcut } from "@/features/session/lib/sessionKeyboardShortcut";
import { orderSessionOptions } from "@/features/session/lib/sessionOptionOrder";
import type { Confidence, SessionQuestion } from "@/features/session/types";

type Args = {
  sessionId: string;
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
  disabled?: boolean;
};

export function useSessionKeyboardShortcuts({
  sessionId,
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
  disabled = false,
}: Args) {
  const displayOptions = useMemo(
    () =>
      currentQuestion
        ? orderSessionOptions(sessionId, currentQuestion.id, currentQuestion.options, {
            disableOptionShuffle: currentQuestion.disableOptionShuffle,
            explanation: currentQuestion.explanation,
          })
        : [],
    [sessionId, currentQuestion],
  );

  useEffect(() => {
    if (disabled) return;
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const action = resolveSessionShortcut(e.key, {
        currentIndex,
        total,
        isShowingFeedback,
        isCurrentAnswered,
        isWaitingForConfidence,
        isPrzeglad,
        optionCount: displayOptions.length,
      });

      if (action.type === "none") return;

      if (action.type === "previous") {
        e.preventDefault();
        onPrevious();
        return;
      }
      if (action.type === "next") {
        e.preventDefault();
        onNext();
        return;
      }
      if (action.type === "confidence") {
        e.preventDefault();
        onConfidencePick(action.confidence);
        return;
      }
      const opt = displayOptions[action.optionIndex];
      if (opt) {
        e.preventDefault();
        selectAndCheck(opt.id);
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
    disabled,
  ]);
}
