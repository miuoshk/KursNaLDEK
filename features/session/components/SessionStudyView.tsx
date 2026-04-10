"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SessionEndDialog } from "@/features/session/components/SessionEndDialog";
import { SessionQuestionContent } from "@/features/session/components/SessionQuestionContent";
import { SessionSaveToast } from "@/features/session/components/SessionSaveToast";
import { SessionSummaryClient } from "@/features/session/components/SessionSummaryClient";
import { SessionTopBar } from "@/features/session/components/SessionTopBar";
import { useQuestionStopwatch } from "@/features/session/hooks/useQuestionStopwatch";
import { useSessionKeyboardShortcuts } from "@/features/session/hooks/useSessionKeyboardShortcuts";
import { useSession } from "@/features/session/hooks/useSession";
import { useSessionStudyFlow } from "@/features/session/hooks/useSessionStudyFlow";
import { useDashboardData } from "@/features/shared/contexts/DashboardDataContext";
import { useDashboardUser } from "@/features/shared/contexts/DashboardUserContext";
import { cn } from "@/lib/utils";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
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
  const [fatigueMessage, setFatigueMessage] = useState<string | null>(null);
  const fatigueShownRef = useRef(false);
  const { profile } = useDashboardData();
  const { streak } = useDashboardUser();
  const isPrzeglad = mode === "przeglad";

  const [completedSummary, setCompletedSummary] = useState<SessionSummaryData | null>(null);
  const completedRef = useRef(false);

  const handleComplete = useCallback((summary: SessionSummaryData) => {
    completedRef.current = true;
    setCompletedSummary(summary);
  }, []);

  const s = useSession(questions, sessionId, mode);
  const qKey = s.currentQuestion?.id ?? "";
  const sw = useQuestionStopwatch(qKey);

  const [submitting, setSubmitting] = useState(false);
  const closeEnd = useCallback(() => setEndOpen(false), []);

  const onFatigueSuggestion = useCallback((message: string) => {
    setFatigueMessage(message);
  }, []);

  const dismissFatigue = useCallback(() => setFatigueMessage(null), []);

  const { handleConfidenceAndNext, handleEndConfirm } = useSessionStudyFlow(
    s.questions,
    {
      isPastReadOnly: s.isPastReadOnly,
      goForwardFromReview: s.goForwardFromReview,
      currentQuestion: s.currentQuestion,
      selectedOptionId: s.selectedOptionId,
      currentIndex: s.currentIndex,
      answers: s.answers,
      completeCurrentAndGoNext: s.completeCurrentAndGoNext,
      replaceQuestionsFromIndex: s.replaceQuestionsFromIndex,
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
    mode === "inteligentna"
      ? { fatigueShownRef, onFatigueSuggestion }
      : null,
    handleComplete,
  );

  useEffect(() => {
    if (completedRef.current) return;
    const t = setInterval(() => setTimerSec((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [completedSummary]);

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

  if (completedSummary) {
    return <SessionSummaryClient summary={completedSummary} />;
  }

  if (!s.currentQuestion) {
    return null;
  }

  const q = s.currentQuestion;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {fatigueMessage ? (
        <div
          role="status"
          className={cn(
            "fixed top-20 left-1/2 z-[60] flex max-w-md -translate-x-1/2 gap-3 rounded-card border border-gold/40 bg-card px-4 py-3 font-body text-body-sm text-primary shadow-lg",
          )}
        >
          <p className="min-w-0 flex-1 leading-relaxed">{fatigueMessage}</p>
          <button
            type="button"
            onClick={dismissFatigue}
            className="shrink-0 rounded-button p-1 text-primary/80 transition-colors hover:bg-white/5 hover:text-primary"
            aria-label="Zamknij"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      ) : null}
      <SessionSaveToast message={saveToast} onDismiss={dismissToast} />
      <SessionEndDialog
        open={endOpen}
        onOpenChange={setEndOpen}
        answeredCount={s.answers.length}
        totalQuestions={s.total}
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
