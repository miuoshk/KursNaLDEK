"use client";

import { useCallback, useRef } from "react";
import type { MutableRefObject } from "react";
import { buildClientSessionSummary } from "@/features/session/lib/buildClientSessionSummary";
import { scheduleServerSessionComplete } from "@/features/session/lib/scheduleServerSessionComplete";
import { persistSessionSummaryToStorage } from "@/features/session/lib/sessionSummaryStorage";
import {
  adaptRemainingQuestions,
  applyDifficultySwapsToRemaining,
  detectFatigue,
  sessionQuestionToRanked,
} from "@/features/session/lib/antares/midSessionAdapter";
import { submitAnswerWithRetry } from "@/features/session/lib/submitAnswerWithRetry";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import type { Confidence, SessionAnswer, SessionMode, SessionQuestion } from "@/features/session/types";

type SessionApi = {
  currentQuestion: SessionQuestion | null;
  currentIndex: number;
  answers: SessionAnswer[];
  answeredMap: Record<string, SessionAnswer>;
  isCurrentAnswered: boolean;
  allAnswered: boolean;
  recordAnswer: (a: SessionAnswer) => void;
  goToNext: () => boolean;
  navigateToIndex: (idx: number) => void;
  replaceQuestionsFromIndex: (fromIndex: number, tail: SessionQuestion[]) => void;
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

type AntaresMidOpts = {
  fatigueShownRef: MutableRefObject<boolean>;
  onFatigueSuggestion: (message: string) => void;
};

export function useSessionStudyFlow(
  questions: SessionQuestion[],
  s: SessionApi,
  meta: FlowMeta,
  timeSpentQuestion: MutableRefObject<number>,
  sessionStart: MutableRefObject<number>,
  setSaveToast: (m: string | null) => void,
  closeEndDialog: () => void,
  antaresMid: AntaresMidOpts | null,
  onComplete: (summary: SessionSummaryData) => void,
) {
  const {
    sessionId,
    subjectId,
    subjectName,
    subjectShortName,
    mode,
    profileXp,
    profileStreak,
  } = meta;

  const finishingRef = useRef(false);

  const finishSession = useCallback(
    (summary: SessionSummaryData) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      persistSessionSummaryToStorage(sessionId, summary);
      onComplete(summary);
      scheduleServerSessionComplete(sessionId, sessionStart.current, onComplete);
    },
    [sessionId, sessionStart, onComplete],
  );

  const buildSummary = useCallback(
    (answeredMap: Record<string, SessionAnswer>) => {
      const answersOrdered = questions
        .map((q) => answeredMap[q.id])
        .filter((a): a is SessionAnswer => a != null);

      return buildClientSessionSummary({
        sessionId,
        subjectId,
        subjectName,
        subjectShortName,
        mode,
        questions,
        answers: answersOrdered,
        profileXp,
        profileStreak,
      });
    },
    [sessionId, subjectId, subjectName, subjectShortName, mode, questions, profileXp, profileStreak],
  );

  const handleAnswerSelected = useCallback(
    (optionId: string) => {
      if (!s.currentQuestion || s.isCurrentAnswered) return;

      const isCorrect = optionId === s.currentQuestion.correctOptionId;
      const confidence: Confidence = isCorrect ? "na_pewno" : "nie_wiedzialem";

      const newAnswer: SessionAnswer = {
        questionId: s.currentQuestion.id,
        selectedOptionId: optionId,
        isCorrect,
        confidence,
        timeSpentSeconds: timeSpentQuestion.current,
      };

      s.recordAnswer(newAnswer);

      void submitAnswerWithRetry({
        sessionId,
        questionId: s.currentQuestion.id,
        selectedOptionId: optionId,
        isCorrect,
        confidence,
        timeSpentSeconds: timeSpentQuestion.current,
        questionOrder: s.currentIndex,
        skipFsrs: mode === "przeglad",
      }).then((res) => {
        if (!res.ok) setSaveToast("Nie udało się zapisać odpowiedzi. Spróbuj ponownie.");
      });

      if (mode === "inteligentna" && antaresMid) {
        const nextIdx = s.currentIndex + 1;
        if (nextIdx < questions.length) {
          const tail = questions.slice(nextIdx);
          if (tail.length > 0) {
            const allAnswers = [...s.answers, newAnswer];
            const answeredSoFar = allAnswers.map((a) => ({
              isCorrect: a.isCorrect,
              confidence: a.confidence ?? "",
              timeSeconds: a.timeSpentSeconds,
            }));
            const adapted = adaptRemainingQuestions({
              answeredSoFar,
              remainingQuestions: tail.map(sessionQuestionToRanked),
            });
            const swapped = applyDifficultySwapsToRemaining(tail, adapted);
            s.replaceQuestionsFromIndex(nextIdx, swapped);

            const fatigue = detectFatigue(answeredSoFar);
            if (
              fatigue.isFatigued &&
              fatigue.suggestion &&
              !antaresMid.fatigueShownRef.current
            ) {
              antaresMid.fatigueShownRef.current = true;
              antaresMid.onFatigueSuggestion(fatigue.suggestion);
            }
          }
        }
      }
    },
    [s, questions, sessionId, mode, timeSpentQuestion, setSaveToast, antaresMid],
  );

  const handleNavigateNext = useCallback(() => {
    const currentAnsweredCount = Object.keys(s.answeredMap).length;
    if (currentAnsweredCount >= questions.length) {
      finishSession(buildSummary(s.answeredMap));
      return;
    }

    const advanced = s.goToNext();
    if (!advanced) {
      const firstUnanswered = questions.findIndex((q) => !(q.id in s.answeredMap));
      if (firstUnanswered >= 0) {
        s.navigateToIndex(firstUnanswered);
      }
    }
  }, [s, questions, finishSession, buildSummary]);

  const handleEndConfirm = useCallback(() => {
    closeEndDialog();
    finishSession(buildSummary(s.answeredMap));
  }, [closeEndDialog, s.answeredMap, finishSession, buildSummary]);

  return { handleAnswerSelected, handleNavigateNext, handleEndConfirm };
}
