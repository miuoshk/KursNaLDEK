"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SessionEndDialog } from "@/features/session/components/SessionEndDialog";
import { SessionQuestionContent } from "@/features/session/components/SessionQuestionContent";
import { SessionSaveToast } from "@/features/session/components/SessionSaveToast";
import { SessionTopBar } from "@/features/session/components/SessionTopBar";
import { useQuestionStopwatch } from "@/features/session/hooks/useQuestionStopwatch";
import { useSessionKeyboardShortcuts } from "@/features/session/hooks/useSessionKeyboardShortcuts";
import { useSession } from "@/features/session/hooks/useSession";
import { useSessionStudyFlow } from "@/features/session/hooks/useSessionStudyFlow";
import { useDashboardData } from "@/features/shared/contexts/DashboardDataContext";
import { useDashboardUser } from "@/features/shared/contexts/DashboardUserContext";
import type { Confidence, SessionMode, SessionQuestion } from "@/features/session/types";

type SessionStudyViewProps = {
  sessionId: string;
  subjectId: string;
  subjectName: string;
  subjectShortName: string;
  mode: SessionMode;
  questions: SessionQuestion[];
};

export function SessionStudyView({
  sessionId,
  subjectId,
  subjectName,
  subjectShortName,
  mode,
  questions,
}: SessionStudyViewProps) {
  const sessionStart = useRef(Date.now());
  const timeSpentQuestion = useRef(0);
  const [timerSec, setTimerSec] = useState(0);
  const [endOpen, setEndOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const { profile } = useDashboardData();
  const { streak } = useDashboardUser();
  const isPrzeglad = mode === "przeglad";

  const s = useSession(questions, sessionId, mode);
  const qKey = s.currentQuestion?.id ?? "";
  const sw = useQuestionStopwatch(qKey);

  const [submitting, setSubmitting] = useState(false);
  const closeEnd = useCallback(() => setEndOpen(false), []);

  const { handleConfidenceAndNext, handleEndConfirm } = useSessionStudyFlow(
    questions,
    {
      isPastReadOnly: s.isPastReadOnly,
      goForwardFromReview: s.goForwardFromReview,
      currentQuestion: s.currentQuestion,
      selectedOptionId: s.selectedOptionId,
      currentIndex: s.currentIndex,
      answers: s.answers,
      completeCurrentAndGoNext: s.completeCurrentAndGoNext,
    },
    {
      sessionId,
      subjectId,
      subjectName,
      subjectShortName,
      mode,
      profileXp: profile?.xp ?? null,
      profileStreak: streak,
    },
    timeSpentQuestion,
    sessionStart,
    setSaveToast,
    closeEnd,
  );

  useEffect(() => {
    const t = setInterval(() => setTimerSec((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const dismissToast = useCallback(() => setSaveToast(null), []);

  const handleCheck = useCallback(() => {
    if (!s.selectedOptionId) return;
    timeSpentQuestion.current = sw.pauseAndGetSeconds();
    s.checkAnswer();
  }, [s, sw]);

  const wrappedConfidenceAndNext = useCallback(
    async (c: Confidence) => {
      if (submitting) return;
      setSubmitting(true);
      await handleConfidenceAndNext(c);
      setSubmitting(false);
    },
    [handleConfidenceAndNext, submitting],
  );

  const handlePrzegladNext = useCallback(() => {
    if (!s.currentQuestion || !s.selectedOptionId) return;
    void wrappedConfidenceAndNext("na_pewno");
  }, [s.currentQuestion, s.selectedOptionId, wrappedConfidenceAndNext]);

  const onConfidenceShortcut = useCallback(
    (c: Confidence) => {
      void wrappedConfidenceAndNext(c);
    },
    [wrappedConfidenceAndNext],
  );

  useSessionKeyboardShortcuts({
    currentQuestion: s.currentQuestion,
    currentIndex: s.currentIndex,
    isShowingFeedback: s.isShowingFeedback,
    isPastReadOnly: s.isPastReadOnly,
    selectedOptionId: s.selectedOptionId,
    selectOption: s.selectOption,
    onCheck: handleCheck,
    onGoPrevious: s.goToPrevious,
    onConfidencePick: isPrzeglad ? undefined : onConfidenceShortcut,
    onContinueReview: isPrzeglad ? handlePrzegladNext : s.goForwardFromReview,
  });

  if (!s.currentQuestion) return null;

  const q = s.currentQuestion;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SessionSaveToast message={saveToast} onDismiss={dismissToast} />
      <SessionEndDialog
        open={endOpen}
        onOpenChange={setEndOpen}
        answeredCount={s.answers.length}
        totalQuestions={questions.length}
        onConfirm={handleEndConfirm}
      />
      <SessionTopBar
        subjectName={subjectName}
        current={s.currentIndex}
        total={s.total}
        mode={mode}
        examElapsedSeconds={timerSec}
        onEnd={() => setEndOpen(true)}
      />
      <SessionQuestionContent
        q={q}
        currentIndex={s.currentIndex}
        total={s.total}
        selectedOptionId={s.selectedOptionId}
        isShowingFeedback={s.isShowingFeedback}
        isPastReadOnly={s.isPastReadOnly}
        mode={mode}
        onSelectOption={s.selectOption}
        onCheck={handleCheck}
        onConfidenceAndNext={(c) => void wrappedConfidenceAndNext(c)}
        submitting={submitting}
        onPrzegladNext={handlePrzegladNext}
        onContinueReview={s.goForwardFromReview}
        onGoToPrevious={s.goToPrevious}
      />
    </div>
  );
}
