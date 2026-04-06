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
  const [examSec, setExamSec] = useState(0);
  const [endOpen, setEndOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const { profile } = useDashboardData();
  const { streak } = useDashboardUser();

  const s = useSession(questions, sessionId, mode);
  const qKey = s.currentQuestion?.id ?? "";
  const sw = useQuestionStopwatch(qKey);

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
    if (mode !== "egzamin") return;
    const t = setInterval(() => setExamSec((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [mode]);

  const dismissToast = useCallback(() => setSaveToast(null), []);

  const handleCheck = useCallback(() => {
    if (!s.selectedOptionId) return;
    timeSpentQuestion.current = sw.pauseAndGetSeconds();
    s.checkAnswer();
  }, [s, sw]);

  const onConfidenceShortcut = useCallback(
    (c: Confidence) => {
      void handleConfidenceAndNext(c);
    },
    [handleConfidenceAndNext],
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
    onConfidencePick: onConfidenceShortcut,
    onContinueReview: s.goForwardFromReview,
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
        examElapsedSeconds={mode === "egzamin" ? examSec : null}
        onEnd={() => setEndOpen(true)}
      />
      <SessionQuestionContent
        q={q}
        currentIndex={s.currentIndex}
        total={s.total}
        selectedOptionId={s.selectedOptionId}
        isShowingFeedback={s.isShowingFeedback}
        isPastReadOnly={s.isPastReadOnly}
        onSelectOption={s.selectOption}
        onCheck={handleCheck}
        onConfidenceAndNext={(c) => {
          void handleConfidenceAndNext(c);
        }}
        onContinueReview={s.goForwardFromReview}
        onGoToPrevious={s.goToPrevious}
      />
    </div>
  );
}
