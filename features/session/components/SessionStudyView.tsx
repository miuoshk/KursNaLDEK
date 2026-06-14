"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SessionEndDialog } from "@/features/session/components/SessionEndDialog";
import { SessionLoadingScreen } from "@/features/session/components/SessionLoadingScreen";
import { SessionQuestionContent } from "@/features/session/components/SessionQuestionContent";
import { SessionSaveToast } from "@/features/session/components/SessionSaveToast";
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
  topicId?: string;
  questions: SessionQuestion[];
  reserveQuestions?: SessionQuestion[];
};

export function SessionStudyView({
  sessionId,
  subjectId,
  subjectName,
  subjectShortName,
  mode,
  topicId,
  questions,
  reserveQuestions = [],
}: SessionStudyViewProps) {
  const sessionStart = useRef(Date.now());
  const timeSpentQuestion = useRef(0);
  const reserveRef = useRef<SessionQuestion[]>(reserveQuestions);
  const [timerSec, setTimerSec] = useState(0);
  const [endOpen, setEndOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [fatigueMessage, setFatigueMessage] = useState<string | null>(null);
  const fatigueShownRef = useRef(false);
  const { profile } = useDashboardData();
  const { streak, showSessionTimer, showSessionTopics } = useDashboardUser();

  const sessionTopicNames = useMemo(() => {
    if (!showSessionTopics) return undefined;
    const names = new Set<string>();
    for (const item of questions) {
      const n = item.topicName?.trim();
      if (n && n !== "Temat") names.add(n);
    }
    return [...names].sort((a, b) => a.localeCompare(b, "pl"));
  }, [questions, showSessionTopics]);

  const selectedTopicName = useMemo(() => {
    if (!topicId) return undefined;
    const fromMatch = questions.find((q) => q.topicId === topicId)?.topicName?.trim();
    if (fromMatch && fromMatch !== "Temat") return fromMatch;
    const names = [
      ...new Set(
        questions
          .map((q) => q.topicName?.trim())
          .filter((n): n is string => Boolean(n && n !== "Temat")),
      ),
    ];
    return names.length === 1 ? names[0] : undefined;
  }, [topicId, questions]);
  const isPrzeglad = mode === "przeglad";

  const router = useRouter();
  const [hasCompleted, setHasCompleted] = useState(false);
  const completedRef = useRef(false);
  const isCompleting = useRef(false);

  const handleCompleting = useCallback(() => {
    completedRef.current = true;
    setHasCompleted(true);
  }, []);

  // Nawigacja dopiero po completeSession (w useSessionStudyFlow) — DB ma
  // is_completed=true zanim serwerowy guard na /podsumowanie się odpali.
  const handleComplete = useCallback((_summary: SessionSummaryData) => {
    if (!isCompleting.current) {
      isCompleting.current = true;
      try {
        sessionStorage.setItem(`session_${sessionId}_completed`, "true");
      } catch { /* SSR / quota */ }
    }
    router.replace(`/sesja/${sessionId}/podsumowanie`);
  }, [router, sessionId]);

  const s = useSession(questions, sessionId, mode);
  const qKey = s.currentQuestion?.id ?? "";
  const sw = useQuestionStopwatch(qKey);

  const [submitting, setSubmitting] = useState(false);
  const closeEnd = useCallback(() => setEndOpen(false), []);

  const onFatigueSuggestion = useCallback((message: string) => {
    setFatigueMessage(message);
  }, []);

  const dismissFatigue = useCallback(() => setFatigueMessage(null), []);

  const { handleSubmitWithConfidence, handleNavigateNext, handleEndConfirm } = useSessionStudyFlow(
    s.questions,
    {
      currentQuestion: s.currentQuestion,
      selectedOptionId: s.selectedOptionId,
      currentIndex: s.currentIndex,
      answers: s.answers,
      answeredMap: s.answeredMap,
      isCurrentAnswered: s.isCurrentAnswered,
      allAnswered: s.allAnswered,
      recordAnswer: s.recordAnswer,
      goToNext: s.goToNext,
      navigateToIndex: s.navigateToIndex,
      replaceQuestionsFromIndex: s.replaceQuestionsFromIndex,
    },
    {
      sessionId,
      subjectId,
      subjectName,
      subjectShortName,
      mode,
      topicId,
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
    reserveRef,
    handleCompleting,
    handleComplete,
  );

  useEffect(() => {
    if (completedRef.current) return;
    const t = setInterval(() => setTimerSec((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [hasCompleted]);

  const dismissToast = useCallback(() => setSaveToast(null), []);

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (s.isCurrentAnswered || s.isShowingFeedback) return;
      timeSpentQuestion.current = sw.pauseAndGetSeconds();
      s.selectAndCheck(optionId);
      if (isPrzeglad) {
        handleSubmitWithConfidence("na_pewno", { optionIdOverride: optionId });
      }
    },
    [s, sw, isPrzeglad, handleSubmitWithConfidence],
  );

  const wrappedConfidencePick = useCallback(
    async (c: Confidence) => {
      if (submitting) return;
      setSubmitting(true);
      handleSubmitWithConfidence(c, { advance: true });
      setSubmitting(false);
    },
    [handleSubmitWithConfidence, submitting],
  );

  const onConfidenceShortcut = useCallback(
    (c: Confidence) => {
      void wrappedConfidencePick(c);
    },
    [wrappedConfidencePick],
  );

  useSessionKeyboardShortcuts({
    currentQuestion: s.currentQuestion,
    currentIndex: s.currentIndex,
    total: s.total,
    isShowingFeedback: s.isShowingFeedback,
    isCurrentAnswered: s.isCurrentAnswered,
    isWaitingForConfidence: s.isWaitingForConfidence,
    isPrzeglad,
    selectAndCheck: handleSelectOption,
    onNext: handleNavigateNext,
    onPrevious: s.goToPrevious,
    onConfidencePick: onConfidenceShortcut,
  });

  // Po wywolaniu router.replace nawigacja na /podsumowanie jest asynchroniczna
  // (potrzebny RSC roundtrip). W tym oknie pokazujemy spojny ekran loading w
  // stylu aplikacji zamiast bialego flash lub starego pytania.
  if (hasCompleted) {
    return <SessionLoadingScreen />;
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
        answeredCount={s.answeredCount}
        totalQuestions={s.total}
        onConfirm={handleEndConfirm}
      />
      <SessionTopBar
        subjectName={subjectName}
        current={s.currentIndex}
        total={s.total}
        mode={mode}
        examElapsedSeconds={showSessionTimer ? timerSec : null}
        selectedTopicName={selectedTopicName}
        sessionTopicNames={sessionTopicNames}
        onEnd={() => setEndOpen(true)}
      />
      <SessionQuestionContent
        q={q}
        currentIndex={s.currentIndex}
        total={s.total}
        selectedOptionId={s.selectedOptionId}
        isShowingFeedback={s.isShowingFeedback}
        isCurrentAnswered={s.isCurrentAnswered}
        isWaitingForConfidence={s.isWaitingForConfidence}
        allAnswered={s.allAnswered}
        isPrzeglad={isPrzeglad}
        submitting={submitting}
        questions={s.questions}
        answeredMap={s.answeredMap}
        onJumpTo={s.navigateToIndex}
        onSelectOption={handleSelectOption}
        onConfidencePick={(c) => void wrappedConfidencePick(c)}
        onNext={handleNavigateNext}
        onPrevious={s.goToPrevious}
        showTopicName={showSessionTopics}
        subjectId={subjectId}
      />
    </div>
  );
}
