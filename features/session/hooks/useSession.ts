"use client";

import { useCallback, useMemo, useState } from "react";
import type { SessionAnswer, SessionMode, SessionQuestion } from "@/features/session/types";

export function useSession(
  initialQuestions: SessionQuestion[],
  sessionId: string,
  mode: SessionMode,
) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);
  const [answeredList, setAnsweredList] = useState<SessionAnswer[]>([]);

  const currentQuestion = questions[currentIndex] ?? null;

  const answeredMap = useMemo(() => {
    const m: Record<string, SessionAnswer> = {};
    for (const a of answeredList) m[a.questionId] = a;
    return m;
  }, [answeredList]);

  const isCurrentAnswered = currentQuestion != null && currentQuestion.id in answeredMap;
  const answeredCount = Object.keys(answeredMap).length;
  const allAnswered = answeredCount >= questions.length;

  const selectAndCheck = useCallback(
    (optionId: string) => {
      if (isShowingFeedback || isCurrentAnswered) return;
      setSelectedOptionId(optionId);
      setIsShowingFeedback(true);
    },
    [isShowingFeedback, isCurrentAnswered],
  );

  const recordAnswer = useCallback((answer: SessionAnswer) => {
    setAnsweredList((prev) => [...prev, answer]);
  }, []);

  const navigateToIndex = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= questions.length) return;
      const q = questions[idx];
      if (!q) return;
      const existing = answeredMap[q.id];
      setCurrentIndex(idx);
      if (existing) {
        setSelectedOptionId(existing.selectedOptionId);
        setIsShowingFeedback(true);
      } else {
        setSelectedOptionId(null);
        setIsShowingFeedback(false);
      }
    },
    [questions, answeredMap],
  );

  const goToNext = useCallback(() => {
    if (currentIndex >= questions.length - 1) return false;
    navigateToIndex(currentIndex + 1);
    return true;
  }, [currentIndex, questions.length, navigateToIndex]);

  const goToPrevious = useCallback(() => {
    if (currentIndex <= 0) return;
    navigateToIndex(currentIndex - 1);
  }, [currentIndex, navigateToIndex]);

  const replaceQuestionsFromIndex = useCallback(
    (fromIndex: number, tail: SessionQuestion[]) => {
      setQuestions((qs) => {
        if (fromIndex < 0 || fromIndex > qs.length) return qs;
        return [...qs.slice(0, fromIndex), ...tail];
      });
    },
    [],
  );

  return {
    sessionId,
    mode,
    questions,
    currentIndex,
    currentQuestion,
    selectedOptionId,
    isShowingFeedback,
    answers: answeredList,
    answeredMap,
    isCurrentAnswered,
    answeredCount,
    allAnswered,
    selectAndCheck,
    recordAnswer,
    goToNext,
    goToPrevious,
    navigateToIndex,
    replaceQuestionsFromIndex,
    isLast: currentIndex >= questions.length - 1,
    total: questions.length,
  };
}
