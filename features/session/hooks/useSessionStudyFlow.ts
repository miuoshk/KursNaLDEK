"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { MutableRefObject } from "react";
import { completeSession } from "@/features/session/api/completeSession";
import { submitAnswerWithRetry } from "@/features/session/lib/submitAnswerWithRetry";
import type { Confidence, SessionAnswer, SessionQuestion } from "@/features/session/types";

const SUMMARY_STORAGE = (id: string) => `session-summary-${id}`;

type SessionApi = {
  isPastReadOnly: boolean;
  goForwardFromReview: () => void;
  currentQuestion: SessionQuestion | null;
  confidence: Confidence | null;
  selectedOptionId: string | null;
  currentIndex: number;
  completeCurrentAndGoNext: (a: SessionAnswer) => void;
};

export function useSessionStudyFlow(
  sessionId: string,
  questions: SessionQuestion[],
  s: SessionApi,
  timeSpentQuestion: MutableRefObject<number>,
  sessionStart: MutableRefObject<number>,
  setSaveToast: (m: string | null) => void,
  closeEndDialog: () => void,
) {
  const router = useRouter();

  const pushSummaryAndNavigate = useCallback(
    (comp: { ok: true; summary: import("@/features/session/summaryTypes").SessionSummaryData }) => {
      try {
        sessionStorage.setItem(SUMMARY_STORAGE(sessionId), JSON.stringify(comp.summary));
      } catch {
        /* ignore */
      }
      router.push(`/sesja/${sessionId}/podsumowanie`);
    },
    [sessionId, router],
  );

  const handleEndConfirm = useCallback(async () => {
    closeEndDialog();
    const dur = Math.floor((Date.now() - sessionStart.current) / 1000);
    const comp = await completeSession({
      sessionId,
      durationSecondsFallback: dur,
    });
    if (!comp.ok) {
      setSaveToast(comp.message);
      return;
    }
    pushSummaryAndNavigate(comp);
  }, [closeEndDialog, sessionId, pushSummaryAndNavigate, sessionStart, setSaveToast]);

  const handleNext = useCallback(async () => {
    if (s.isPastReadOnly) {
      s.goForwardFromReview();
      return;
    }
    if (!s.currentQuestion || s.confidence === null || !s.selectedOptionId) return;
    const isCorrect = s.selectedOptionId === s.currentQuestion.correctOptionId;
    const isLast = s.currentIndex >= questions.length - 1;
    const payload = {
      sessionId,
      questionId: s.currentQuestion.id,
      selectedOptionId: s.selectedOptionId,
      isCorrect,
      confidence: s.confidence as Confidence,
      timeSpentSeconds: timeSpentQuestion.current,
      questionOrder: s.currentIndex,
    };

    if (!isLast) {
      s.completeCurrentAndGoNext({
        questionId: s.currentQuestion.id,
        selectedOptionId: s.selectedOptionId,
        isCorrect,
        confidence: s.confidence,
        timeSpentSeconds: timeSpentQuestion.current,
      });
      void submitAnswerWithRetry(payload).then((res) => {
        if (!res.ok) setSaveToast("Nie udało się zapisać odpowiedzi. Spróbuj ponownie.");
      });
      return;
    }

    const res = await submitAnswerWithRetry(payload);
    if (!res.ok) {
      setSaveToast("Nie udało się zapisać odpowiedzi. Spróbuj ponownie.");
      return;
    }
    const dur = Math.floor((Date.now() - sessionStart.current) / 1000);
    const comp = await completeSession({
      sessionId,
      durationSecondsFallback: dur,
    });
    if (!comp.ok) {
      setSaveToast(comp.message);
      return;
    }
    pushSummaryAndNavigate(comp);
  }, [s, questions.length, sessionId, pushSummaryAndNavigate, timeSpentQuestion, sessionStart, setSaveToast]);

  return { handleNext, handleEndConfirm };
}
