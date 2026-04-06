"use client";

import { useCallback, useState } from "react";
import type { Confidence, SessionAnswer, SessionMode, SessionQuestion } from "@/features/session/types";

export function useSession(
  initialQuestions: SessionQuestion[],
  sessionId: string,
  mode: SessionMode,
) {
  const [questions] = useState(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [confidence, setConfidenceState] = useState<Confidence | null>(null);
  const [isPastReadOnly, setIsPastReadOnly] = useState(false);

  const currentQuestion = questions[currentIndex] ?? null;

  const selectOption = useCallback(
    (optionId: string) => {
      if (isShowingFeedback || isPastReadOnly) return;
      setSelectedOptionId(optionId);
    },
    [isShowingFeedback, isPastReadOnly],
  );

  const checkAnswer = useCallback(() => {
    if (isPastReadOnly) return;
    if (!currentQuestion || !selectedOptionId) return;
    setIsShowingFeedback(true);
  }, [currentQuestion, selectedOptionId, isPastReadOnly]);

  const setConfidence = useCallback((c: Confidence) => {
    if (isPastReadOnly) return;
    setConfidenceState(c);
  }, [isPastReadOnly]);

  const resetForNext = useCallback(() => {
    setSelectedOptionId(null);
    setIsShowingFeedback(false);
    setConfidenceState(null);
    setIsPastReadOnly(false);
  }, []);

  const completeCurrentAndGoNext = useCallback(
    (answer: SessionAnswer) => {
      setAnswers((a) => [...a, answer]);
      resetForNext();
      setCurrentIndex((i) => i + 1);
    },
    [resetForNext],
  );

  const goToPrevious = useCallback(() => {
    if (currentIndex <= 0 || isShowingFeedback) return;
    const prevIdx = currentIndex - 1;
    const prev = answers[prevIdx];
    if (!prev) return;
    setCurrentIndex(prevIdx);
    setSelectedOptionId(prev.selectedOptionId);
    setIsShowingFeedback(true);
    setConfidenceState(prev.confidence);
    setIsPastReadOnly(true);
  }, [currentIndex, isShowingFeedback, answers]);

  const goForwardFromReview = useCallback(() => {
    if (!isPastReadOnly) return;
    const nextIdx = currentIndex + 1;
    setIsPastReadOnly(false);
    if (nextIdx >= questions.length) return;
    setCurrentIndex(nextIdx);
    const nextA = answers[nextIdx];
    if (nextA) {
      setSelectedOptionId(nextA.selectedOptionId);
      setIsShowingFeedback(true);
      setConfidenceState(nextA.confidence);
    } else {
      setSelectedOptionId(null);
      setIsShowingFeedback(false);
      setConfidenceState(null);
    }
  }, [isPastReadOnly, currentIndex, questions.length, answers]);

  return {
    sessionId,
    mode,
    questions,
    currentIndex,
    currentQuestion,
    selectedOptionId,
    isShowingFeedback,
    answers,
    confidence,
    isPastReadOnly,
    selectOption,
    checkAnswer,
    setConfidence,
    completeCurrentAndGoNext,
    resetForNext,
    goToPrevious,
    goForwardFromReview,
    isLast: currentIndex >= questions.length - 1,
    total: questions.length,
  };
}
