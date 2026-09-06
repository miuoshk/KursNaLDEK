"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { nextSelectedOptionId } from "@/features/session/lib/sessionOptionSelect";
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
  const selectedOptionIdRef = useRef<string | null>(null);

  const currentQuestion = questions[currentIndex] ?? null;

  const answeredMap = useMemo(() => {
    const m: Record<string, SessionAnswer> = {};
    for (const a of answeredList) m[a.questionId] = a;
    return m;
  }, [answeredList]);

  const isCurrentAnswered = currentQuestion != null && currentQuestion.id in answeredMap;
  const answeredCount = Object.keys(answeredMap).length;
  const allAnswered = answeredCount >= questions.length;

  const selectOption = useCallback(
    (optionId: string) => {
      if (isShowingFeedback || isCurrentAnswered) return;
      const next = nextSelectedOptionId(selectedOptionIdRef.current, optionId);
      selectedOptionIdRef.current = next;
      setSelectedOptionId(next);
    },
    [isShowingFeedback, isCurrentAnswered],
  );

  const revealFeedback = useCallback(() => {
    // Ref, not state: przegląd calls this in the same tick as selectOption.
    if (isShowingFeedback || selectedOptionIdRef.current == null) return;
    setIsShowingFeedback(true);
  }, [isShowingFeedback]);

  const selectAndCheck = useCallback(
    (optionId: string) => {
      if (isShowingFeedback || isCurrentAnswered || selectedOptionId) return;
      selectedOptionIdRef.current = optionId;
      setSelectedOptionId(optionId);
      setIsShowingFeedback(true);
    },
    [isShowingFeedback, isCurrentAnswered, selectedOptionId],
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
        selectedOptionIdRef.current = existing.selectedOptionId;
        setSelectedOptionId(existing.selectedOptionId);
        setIsShowingFeedback(true);
      } else {
        selectedOptionIdRef.current = null;
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

  const isWaitingForConfidence =
    selectedOptionId != null &&
    !isShowingFeedback &&
    currentQuestion != null &&
    !(currentQuestion.id in answeredMap);

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
    isWaitingForConfidence,
    answeredCount,
    allAnswered,
    selectOption,
    revealFeedback,
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
