"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { MutableRefObject } from "react";
import { completeSession } from "@/features/session/api/completeSession";
import { buildClientSessionSummary } from "@/features/session/lib/buildClientSessionSummary";
import { scheduleServerSessionComplete } from "@/features/session/lib/scheduleServerSessionComplete";
import { persistSessionSummaryToStorage } from "@/features/session/lib/sessionSummaryStorage";
import { submitAnswerWithRetry } from "@/features/session/lib/submitAnswerWithRetry";
import type { Confidence, SessionAnswer, SessionMode, SessionQuestion } from "@/features/session/types";
type SessionApi = {
  isPastReadOnly: boolean;
  goForwardFromReview: () => void;
  currentQuestion: SessionQuestion | null;
  selectedOptionId: string | null;
  currentIndex: number;
  answers: SessionAnswer[];
  completeCurrentAndGoNext: (a: SessionAnswer) => void;
};

type FlowMeta = {
  sessionId: string;
  subjectId: string;
  subjectName: string;
  subjectShortName: string;
  mode: SessionMode;
  profileXp: number | null;
  profileStreak: number;
};

export function useSessionStudyFlow(
  questions: SessionQuestion[],
  s: SessionApi,
  meta: FlowMeta,
  timeSpentQuestion: MutableRefObject<number>,
  sessionStart: MutableRefObject<number>,
  setSaveToast: (m: string | null) => void,
  closeEndDialog: () => void,
) {
  const router = useRouter();
  const {
    sessionId,
    subjectId,
    subjectName,
    subjectShortName,
    mode,
    profileXp,
    profileStreak,
  } = meta;

  const pushSummaryAndNavigate = useCallback(
    (summary: import("@/features/session/summaryTypes").SessionSummaryData) => {
      persistSessionSummaryToStorage(sessionId, summary);
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
    pushSummaryAndNavigate(comp.summary);
  }, [closeEndDialog, sessionId, pushSummaryAndNavigate, sessionStart, setSaveToast]);

  const handleConfidenceAndNext = useCallback(
    async (confidence: Confidence) => {
      if (s.isPastReadOnly) {
        s.goForwardFromReview();
        return;
      }
      if (!s.currentQuestion || !s.selectedOptionId) return;

      const isCorrect = s.selectedOptionId === s.currentQuestion.correctOptionId;
      const isLast = s.currentIndex >= questions.length - 1;
      const payload = {
        sessionId,
        questionId: s.currentQuestion.id,
        selectedOptionId: s.selectedOptionId,
        isCorrect,
        confidence,
        timeSpentSeconds: timeSpentQuestion.current,
        questionOrder: s.currentIndex,
        skipFsrs: mode === "przeglad",
      };

      const newAnswer: SessionAnswer = {
        questionId: s.currentQuestion.id,
        selectedOptionId: s.selectedOptionId,
        isCorrect,
        confidence,
        timeSpentSeconds: timeSpentQuestion.current,
      };

      if (!isLast) {
        s.completeCurrentAndGoNext(newAnswer);
        void submitAnswerWithRetry(payload).then((res) => {
          if (!res.ok) setSaveToast("Nie udało się zapisać odpowiedzi. Spróbuj ponownie.");
        });
        return;
      }

      s.completeCurrentAndGoNext(newAnswer);

      const allAnswers = [...s.answers, newAnswer];
      const summary = buildClientSessionSummary({
        sessionId,
        subjectId,
        subjectName,
        subjectShortName,
        mode,
        questions,
        answers: allAnswers,
        profileXp,
        profileStreak,
      });
      pushSummaryAndNavigate(summary);

      void submitAnswerWithRetry(payload).catch(() => {});
      scheduleServerSessionComplete(sessionId, sessionStart.current);
    },
    [
      s,
      questions,
      sessionId,
      subjectId,
      subjectName,
      subjectShortName,
      mode,
      profileXp,
      profileStreak,
      pushSummaryAndNavigate,
      timeSpentQuestion,
      sessionStart,
      setSaveToast,
    ],
  );

  return { handleConfidenceAndNext, handleEndConfirm };
}
