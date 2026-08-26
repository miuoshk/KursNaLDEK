"use client";

import { useCallback, useRef } from "react";
import type { MutableRefObject } from "react";
import { buildClientSessionSummary } from "@/features/session/lib/buildClientSessionSummary";
import {
  selectFeedbackVariant,
  type FeedbackVariant,
} from "@/features/session/lib/adaptiveFeedback";
import { parseDailyPlanProgress } from "@/features/session/lib/parseDailyPlanProgress";
import { scheduleServerSessionComplete } from "@/features/session/lib/scheduleServerSessionComplete";
import { persistSessionSummaryToStorage } from "@/features/session/lib/sessionSummaryStorage";
import { markSessionSummaryPerfT0, logPerf } from "@/features/session/lib/perfLog";
import { applyReserveSwap } from "@/features/session/lib/antares/reservePool";
import { scheduleConceptTransfer } from "@/features/session/lib/antares/conceptTransfer";
import {
  adaptRemainingQuestions,
  applyDifficultySwapsToRemaining,
  detectFatigue,
  sessionQuestionToRanked,
} from "@/features/session/lib/antares/midSessionAdapter";
import { submitAnswerWithRetry } from "@/features/session/lib/submitAnswerWithRetry";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import type {
  Confidence,
  SessionAnswer,
  SessionMode,
  SessionQuestion,
} from "@/features/session/types";

type SessionApi = {
  currentQuestion: SessionQuestion | null;
  selectedOptionId: string | null;
  currentIndex: number;
  answers: SessionAnswer[];
  answeredMap: Record<string, SessionAnswer>;
  isCurrentAnswered: boolean;
  allAnswered: boolean;
  recordAnswer: (a: SessionAnswer) => void;
  goToNext: () => boolean;
  navigateToIndex: (idx: number) => void;
  replaceQuestionsFromIndex: (
    fromIndex: number,
    tail: SessionQuestion[],
  ) => void;
};

type FlowMeta = {
  sessionId: string;
  subjectId: string;
  subjectName: string;
  subjectShortName: string;
  mode: SessionMode;
  topicId?: string;
  profileXp: number | null;
  profileStreak: number;
  adaptiveFeedbackEnabled?: boolean;
  planSnapshot?: unknown;
};

export function useSessionStudyFlow(
  questions: SessionQuestion[],
  s: SessionApi,
  meta: FlowMeta,
  timeSpentQuestion: MutableRefObject<number>,
  sessionStart: MutableRefObject<number>,
  setSaveToast: (m: string | null) => void,
  closeEndDialog: () => void,
  reserveRef: MutableRefObject<SessionQuestion[]>,
  onFatigueDetected: () => void,
  /** Natychmiast po ostatniej odpowiedzi — pokaż wyniki z pamięci. */
  onComplete: (summary: SessionSummaryData) => void,
) {
  const {
    sessionId,
    subjectId,
    subjectName,
    subjectShortName,
    mode,
    topicId,
    profileXp,
    profileStreak,
    adaptiveFeedbackEnabled = false,
    planSnapshot,
  } = meta;

  const finishingRef = useRef(false);
  const pendingSavesRef = useRef<Set<Promise<unknown>>>(new Set());

  const trackPendingSave = useCallback((promise: Promise<unknown>) => {
    pendingSavesRef.current.add(promise);
    void promise.finally(() => {
      pendingSavesRef.current.delete(promise);
    });
  }, []);

  const finishSession = useCallback(
    (summary: SessionSummaryData) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      persistSessionSummaryToStorage(sessionId, summary);
      markSessionSummaryPerfT0(sessionId);
      onComplete(summary);

      void (async () => {
        const pending = Array.from(pendingSavesRef.current);
        const drainStartedAt = Date.now();
        if (pending.length > 0) {
          await Promise.allSettled(pending);
        }
        logPerf("pending saves drained", {
          sessionId,
          pendingCount: pending.length,
          ms: Date.now() - drainStartedAt,
        });
        scheduleServerSessionComplete(
          sessionId,
          sessionStart.current,
          undefined,
          summary.topicId,
        );
      })();
    },
    [sessionId, sessionStart, onComplete],
  );

  const buildSummary = useCallback(
    (answeredMap: Record<string, SessionAnswer>) => {
      const answersOrdered = questions
        .map((q) => answeredMap[q.id])
        .filter((a): a is SessionAnswer => a != null);

      const durationSeconds = answersOrdered.reduce(
        (sum, answer) => sum + answer.timeSpentSeconds,
        0,
      );

      return buildClientSessionSummary({
        sessionId,
        subjectId,
        subjectName,
        subjectShortName,
        mode,
        topicId,
        questions,
        answers: answersOrdered,
        profileXp,
        profileStreak,
        dailyPlan: parseDailyPlanProgress(
          planSnapshot,
          answersOrdered.length,
          durationSeconds,
        ),
      });
    },
    [
      sessionId,
      subjectId,
      subjectName,
      subjectShortName,
      mode,
      topicId,
      questions,
      profileXp,
      profileStreak,
      planSnapshot,
    ],
  );

  const handleSubmitWithConfidence = useCallback(
    (
      confidence: Confidence | null,
      {
        advance = false,
        optionIdOverride,
        feedbackDwellSeconds = null,
        feedbackVariant: feedbackVariantOverride,
      }: {
        advance?: boolean;
        optionIdOverride?: string;
        feedbackDwellSeconds?: number | null;
        feedbackVariant?: FeedbackVariant;
      } = {},
    ) => {
      if (!s.currentQuestion || s.isCurrentAnswered) return;

      // `s.selectedOptionId` is read from the closure of the current render and
      // can lag behind `selectAndCheck()` when both run in the same tick (the
      // przeglad auto-submit flow). Accept an explicit override to avoid that
      // stale-state race.
      const optionId = optionIdOverride ?? s.selectedOptionId;
      if (!optionId) return;
      const currentQ = s.currentQuestion;
      const isCorrect = optionId === currentQ.correctOptionId;
      const feedbackVariant = adaptiveFeedbackEnabled
        ? (feedbackVariantOverride ??
          selectFeedbackVariant({
            question: currentQ,
            isCorrect,
            timeSpentSeconds: timeSpentQuestion.current,
          }))
        : "standard";

      const newAnswer: SessionAnswer = {
        questionId: currentQ.id,
        selectedOptionId: optionId,
        isCorrect,
        confidence,
        timeSpentSeconds: timeSpentQuestion.current,
      };

      s.recordAnswer(newAnswer);

      const savePromise = submitAnswerWithRetry({
        sessionId,
        questionId: currentQ.id,
        selectedOptionId: optionId,
        confidence,
        timeSpentSeconds: timeSpentQuestion.current,
        questionOrder: s.currentIndex,
        feedbackVariant,
        feedbackDwellSeconds,
      }).then((res) => {
        if (!res.ok)
          setSaveToast("Nie udało się zapisać odpowiedzi. Spróbuj ponownie.");
      });
      trackPendingSave(savePromise);

      const allAnswers = [...s.answers, newAnswer];
      const answeredSoFar = allAnswers.map((a) => ({
        isCorrect: a.isCorrect,
        confidence: a.confidence ?? "",
        timeSeconds: a.timeSpentSeconds,
      }));
      if (detectFatigue(answeredSoFar).isFatigued) {
        onFatigueDetected();
      }

      if (mode === "inteligentna") {
        const nextIdx = s.currentIndex + 1;
        if (nextIdx < questions.length) {
          const tail = questions.slice(nextIdx);
          if (tail.length > 0) {
            const adapted = adaptRemainingQuestions({
              answeredSoFar,
              remainingQuestions: tail.map(sessionQuestionToRanked),
            });
            const swapped = applyDifficultySwapsToRemaining(tail, adapted);
            const reserveSwap = applyReserveSwap(
              swapped,
              reserveRef.current,
              answeredSoFar,
            );
            const transfer = scheduleConceptTransfer(
              currentQ,
              reserveSwap.tail,
              reserveSwap.reserve,
              !isCorrect || Boolean(currentQ.antares?.isLeech),
            );
            reserveRef.current = transfer.reserve;
            s.replaceQuestionsFromIndex(nextIdx, transfer.tail);
          }
        }
      }

      if (!advance) return;

      const newAnsweredCount = Object.keys(s.answeredMap).length + 1;
      if (newAnsweredCount >= questions.length) {
        const fullMap = { ...s.answeredMap, [newAnswer.questionId]: newAnswer };
        finishSession(buildSummary(fullMap));
        return;
      }

      const advanced = s.goToNext();
      if (!advanced) {
        const firstUnanswered = questions.findIndex(
          (q) => q.id !== currentQ.id && !(q.id in s.answeredMap),
        );
        if (firstUnanswered >= 0) {
          s.navigateToIndex(firstUnanswered);
        }
      }
    },
    [
      s,
      questions,
      sessionId,
      mode,
      timeSpentQuestion,
      setSaveToast,
      reserveRef,
      finishSession,
      buildSummary,
      trackPendingSave,
      onFatigueDetected,
      adaptiveFeedbackEnabled,
    ],
  );

  const handleNavigateNext = useCallback(() => {
    const currentAnsweredCount = Object.keys(s.answeredMap).length;
    if (currentAnsweredCount >= questions.length) {
      finishSession(buildSummary(s.answeredMap));
      return;
    }

    const advanced = s.goToNext();
    if (!advanced) {
      if (mode === "przeglad") {
        finishSession(buildSummary(s.answeredMap));
        return;
      }
      const firstUnanswered = questions.findIndex(
        (q) => !(q.id in s.answeredMap),
      );
      if (firstUnanswered >= 0) {
        s.navigateToIndex(firstUnanswered);
      }
    }
  }, [s, questions, mode, finishSession, buildSummary]);

  const handleEndConfirm = useCallback(() => {
    closeEndDialog();
    finishSession(buildSummary(s.answeredMap));
  }, [closeEndDialog, s.answeredMap, finishSession, buildSummary]);

  return {
    handleSubmitWithConfidence,
    handleNavigateNext,
    handleEndConfirm,
    trackPendingSave,
  };
}
