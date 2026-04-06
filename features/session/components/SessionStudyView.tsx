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
import type { SessionMode, SessionQuestion } from "@/features/session/types";

type SessionStudyViewProps = {
  sessionId: string;
  subjectName: string;
  mode: SessionMode;
  questions: SessionQuestion[];
};

export function SessionStudyView({
  sessionId,
  subjectName,
  mode,
  questions,
}: SessionStudyViewProps) {
  const sessionStart = useRef(Date.now());
  const timeSpentQuestion = useRef(0);
  const [examSec, setExamSec] = useState(0);
  const [endOpen, setEndOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const s = useSession(questions, sessionId, mode);
  const qKey = s.currentQuestion?.id ?? "";
  const sw = useQuestionStopwatch(qKey);

  const closeEnd = useCallback(() => setEndOpen(false), []);

  const { handleNext, handleEndConfirm } = useSessionStudyFlow(
    sessionId,
    questions,
    {
      isPastReadOnly: s.isPastReadOnly,
      goForwardFromReview: s.goForwardFromReview,
      currentQuestion: s.currentQuestion,
      confidence: s.confidence,
      selectedOptionId: s.selectedOptionId,
      currentIndex: s.currentIndex,
      completeCurrentAndGoNext: s.completeCurrentAndGoNext,
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

  useSessionKeyboardShortcuts({
    currentQuestion: s.currentQuestion,
    currentIndex: s.currentIndex,
    isShowingFeedback: s.isShowingFeedback,
    isPastReadOnly: s.isPastReadOnly,
    selectedOptionId: s.selectedOptionId,
    confidence: s.confidence,
    selectOption: s.selectOption,
    onCheck: handleCheck,
    onGoPrevious: s.goToPrevious,
    onGoNext: () => {
      void handleNext();
    },
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
        confidence={s.confidence}
        onSelectOption={s.selectOption}
        onConfidence={s.setConfidence}
        onCheck={handleCheck}
        onNext={handleNext}
        onGoToPrevious={s.goToPrevious}
      />
    </div>
  );
}
