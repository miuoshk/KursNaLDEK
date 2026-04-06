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

  const currentQuestion = questions[currentIndex] ?? null;

  const selectOption = useCallback((optionId: string) => {
    if (isShowingFeedback) return;
    setSelectedOptionId(optionId);
  }, [isShowingFeedback]);

  const checkAnswer = useCallback(() => {
    if (!currentQuestion || !selectedOptionId) return;
    setIsShowingFeedback(true);
  }, [currentQuestion, selectedOptionId]);

  const setConfidence = useCallback((c: Confidence) => {
    setConfidenceState(c);
  }, []);

  const resetForNext = useCallback(() => {
    setSelectedOptionId(null);
    setIsShowingFeedback(false);
    setConfidenceState(null);
  }, []);

  const completeCurrentAndGoNext = useCallback(
    (answer: SessionAnswer) => {
      setAnswers((a) => [...a, answer]);
      resetForNext();
      setCurrentIndex((i) => i + 1);
    },
    [resetForNext],
  );

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
    selectOption,
    checkAnswer,
    setConfidence,
    completeCurrentAndGoNext,
    resetForNext,
    isLast: currentIndex >= questions.length - 1,
    total: questions.length,
  };
}
