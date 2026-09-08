"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { recordFeedbackDwell } from "@/features/session/api/recordFeedbackDwell";
import { SessionEndDialog } from "@/features/session/components/SessionEndDialog";
import { SessionQuestionContent } from "@/features/session/components/SessionQuestionContent";
import { SessionSummaryClient } from "@/features/session/components/SessionSummaryClient";
import { SessionSaveToast } from "@/features/session/components/SessionSaveToast";
import { SessionTopBar } from "@/features/session/components/SessionTopBar";
import { useQuestionStopwatch } from "@/features/session/hooks/useQuestionStopwatch";
import { useSessionKeyboardShortcuts } from "@/features/session/hooks/useSessionKeyboardShortcuts";
import { useSession } from "@/features/session/hooks/useSession";
import { useSessionStudyFlow } from "@/features/session/hooks/useSessionStudyFlow";
import {
  resolveExperimentFeedbackVariant,
  type FeedbackVariant,
} from "@/features/session/lib/adaptiveFeedback";
import { useDashboardData } from "@/features/shared/contexts/DashboardDataContext";
import { useDashboardUser } from "@/features/shared/contexts/DashboardUserContext";
import { createFeedbackEventQueue } from "@/features/session/lib/feedbackTelemetry";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import type {
  Confidence,
  SessionMode,
  SessionQuestion,
  SourceFilter,
} from "@/features/session/types";

type SessionStudyViewProps = {
  sessionId: string;
  subjectId: string;
  subjectName: string;
  subjectShortName: string;
  mode: SessionMode;
  topicId?: string;
  sourceFilter?: SourceFilter;
  questions: SessionQuestion[];
  reserveQuestions?: SessionQuestion[];
  product?: string | null;
  adaptiveFeedbackEnabled?: boolean;
  planSnapshot?: unknown;
};

export function SessionStudyView({
  sessionId,
  subjectId,
  subjectName,
  subjectShortName,
  mode,
  topicId,
  sourceFilter,
  questions,
  reserveQuestions = [],
  product,
  adaptiveFeedbackEnabled = false,
  planSnapshot,
}: SessionStudyViewProps) {
  const t = useTranslations("session");
  const topicDefault = t("topicDefault");
  const sessionStart = useRef(0);
  const timeSpentQuestion = useRef(0);
  const reserveRef = useRef<SessionQuestion[]>(reserveQuestions);
  const [timerSec, setTimerSec] = useState(0);
  const [endOpen, setEndOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [fatigueDetected, setFatigueDetected] = useState(false);
  const [feedbackState, setFeedbackState] = useState<{
    questionId: string;
    variant: FeedbackVariant;
  } | null>(null);
  const feedbackShownAtRef = useRef<{
    questionId: string;
    shownAt: number;
  } | null>(null);
  const confidenceShownAtRef = useRef<{
    questionId: string;
    shownAt: number;
  } | null>(null);
  const feedbackEventsRef = useRef(createFeedbackEventQueue());
  const drainFeedbackEvents = useCallback(
    () => feedbackEventsRef.current.drain(),
    [],
  );
  const onFeedbackShown = useCallback(
    (event: Parameters<typeof feedbackEventsRef.current.recordShown>[0]) => {
      feedbackEventsRef.current.recordShown(event);
    },
    [],
  );
  const onFeedbackExpand = useCallback(
    (
      questionId: string,
      section: Parameters<typeof feedbackEventsRef.current.recordExpand>[1],
    ) => {
      feedbackEventsRef.current.recordExpand(questionId, section);
    },
    [],
  );
  const { profile } = useDashboardData();
  const { streak, showSessionTimer, showSessionTopics } = useDashboardUser();

  const sessionTopicNames = useMemo(() => {
    if (!showSessionTopics) return undefined;
    const names = new Set<string>();
    for (const item of questions) {
      const n = item.topicName?.trim();
      if (n && n !== topicDefault) names.add(n);
    }
    return [...names].sort((a, b) => a.localeCompare(b, "pl"));
  }, [questions, showSessionTopics, topicDefault]);

  const selectedTopicName = useMemo(() => {
    if (!topicId) return undefined;
    const fromMatch = questions
      .find((q) => q.topicId === topicId)
      ?.topicName?.trim();
    if (fromMatch && fromMatch !== topicDefault) return fromMatch;
    const names = [
      ...new Set(
        questions
          .map((q) => q.topicName?.trim())
          .filter((n): n is string => Boolean(n && n !== topicDefault)),
      ),
    ];
    return names.length === 1 ? names[0] : undefined;
  }, [topicId, questions, topicDefault]);
  const isPrzeglad = mode === "przeglad";

  const router = useRouter();
  const [instantSummary, setInstantSummary] =
    useState<SessionSummaryData | null>(null);
  const completedRef = useRef(false);

  const handleComplete = useCallback(
    (summary: SessionSummaryData) => {
      if (completedRef.current) return;
      completedRef.current = true;
      setInstantSummary(summary);
      try {
        sessionStorage.setItem(`session_${sessionId}_completed`, "true");
      } catch {
        /* SSR / quota */
      }
      router.replace(`/sesja/${sessionId}/podsumowanie`);
    },
    [router, sessionId],
  );

  const s = useSession(questions, sessionId, mode);
  const qKey = s.currentQuestion?.id ?? "";
  const sw = useQuestionStopwatch(qKey);

  const [submitting, setSubmitting] = useState(false);
  const closeEnd = useCallback(() => setEndOpen(false), []);
  const markFatigueDetected = useCallback(() => {
    if (adaptiveFeedbackEnabled) setFatigueDetected(true);
  }, [adaptiveFeedbackEnabled]);

  const {
    handleSubmitWithConfidence,
    handleNavigateNext,
    handleEndConfirm,
    trackPendingSave,
  } = useSessionStudyFlow(
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
      sourceFilter,
      profileXp: profile?.xp ?? null,
      profileStreak: streak,
      adaptiveFeedbackEnabled,
      planSnapshot,
      drainFeedbackEvents,
    },
    timeSpentQuestion,
    sessionStart,
    setSaveToast,
    closeEnd,
    reserveRef,
    markFatigueDetected,
    handleComplete,
  );

  useEffect(() => {
    sessionStart.current = Date.now();
  }, []);

  useEffect(() => {
    if (completedRef.current) return;
    const t = setInterval(() => setTimerSec((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [instantSummary]);

  const dismissToast = useCallback(() => setSaveToast(null), []);

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (s.isCurrentAnswered || s.isShowingFeedback) {
        return;
      }
      if (isPrzeglad && s.selectedOptionId) {
        return;
      }
      if (!s.selectedOptionId) {
        timeSpentQuestion.current = sw.pauseAndGetSeconds();
      }
      const currentQuestion = s.currentQuestion;
      if (!currentQuestion) return;
      s.selectOption(optionId);
      if (isPrzeglad) {
        const variant = resolveExperimentFeedbackVariant({
          treatment: adaptiveFeedbackEnabled,
          question: currentQuestion,
          isCorrect: optionId === currentQuestion.correctOptionId,
          timeSpentSeconds: timeSpentQuestion.current,
          confidence: null,
        }).variant;
        setFeedbackState({ questionId: currentQuestion.id, variant });
        feedbackShownAtRef.current = {
          questionId: currentQuestion.id,
          shownAt: Date.now(),
        };
        s.revealFeedback();
        handleSubmitWithConfidence(null, {
          optionIdOverride: optionId,
          feedbackVariant: variant,
        });
        return;
      }
    },
    [s, sw, isPrzeglad, handleSubmitWithConfidence, adaptiveFeedbackEnabled],
  );

  const wrappedConfidencePick = useCallback(
    async (c: Confidence) => {
      if (submitting) return;
      const currentQuestion = s.currentQuestion;
      if (!currentQuestion || s.isCurrentAnswered) return;
      setSubmitting(true);
      const confidenceShown = confidenceShownAtRef.current;
      const confidenceLatencyMs =
        confidenceShown && confidenceShown.questionId === currentQuestion.id
          ? Math.min(
              3_600_000,
              Math.max(0, Date.now() - confidenceShown.shownAt),
            )
          : null;
      confidenceShownAtRef.current = null;
      const variant = resolveExperimentFeedbackVariant({
        treatment: adaptiveFeedbackEnabled,
        question: currentQuestion,
        isCorrect:
          (s.selectedOptionId ?? "") === currentQuestion.correctOptionId,
        timeSpentSeconds: timeSpentQuestion.current,
        confidence: c,
      }).variant;
      setFeedbackState({ questionId: currentQuestion.id, variant });
      s.revealFeedback();
      feedbackShownAtRef.current = {
        questionId: currentQuestion.id,
        shownAt: Date.now(),
      };
      await handleSubmitWithConfidence(c, {
        advance: false,
        feedbackVariant: variant,
        confidenceLatencyMs,
      });
      setSubmitting(false);
    },
    [
      adaptiveFeedbackEnabled,
      handleSubmitWithConfidence,
      s,
      submitting,
    ],
  );

  const flushClassicFeedbackDwell = useCallback(() => {
    const shown = feedbackShownAtRef.current;
    if (!shown) return;
    feedbackShownAtRef.current = null;
    const variant =
      feedbackState?.questionId === shown.questionId
        ? feedbackState.variant
        : "standard";
    const payload = {
      sessionId,
      questionId: shown.questionId,
      variant,
      dwellSeconds: Math.min(
        3600,
        Math.max(0, (Date.now() - shown.shownAt) / 1000),
      ),
    };
    const feedbackSave = (async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = await recordFeedbackDwell(payload);
        if (result.ok) return;
        await new Promise((resolve) =>
          setTimeout(resolve, 300 * (attempt + 1)),
        );
      }
    })();
    trackPendingSave(feedbackSave);
  }, [feedbackState, sessionId, trackPendingSave]);

  const wrappedNavigateNext = useCallback(() => {
    flushClassicFeedbackDwell();
    handleNavigateNext();
  }, [flushClassicFeedbackDwell, handleNavigateNext]);

  const wrappedPrevious = useCallback(() => {
    flushClassicFeedbackDwell();
    s.goToPrevious();
  }, [flushClassicFeedbackDwell, s]);

  const wrappedJumpTo = useCallback(
    (index: number) => {
      flushClassicFeedbackDwell();
      s.navigateToIndex(index);
    },
    [flushClassicFeedbackDwell, s],
  );

  const wrappedEndConfirm = useCallback(() => {
    flushClassicFeedbackDwell();
    handleEndConfirm();
  }, [flushClassicFeedbackDwell, handleEndConfirm]);

  const onConfidenceShortcut = useCallback(
    (c: Confidence) => {
      void wrappedConfidencePick(c);
    },
    [wrappedConfidencePick],
  );

  const onConfidenceBarShown = useCallback((questionId: string) => {
    // KROK 8: latency od pojawienia belki, nie od kliknięcia opcji.
    confidenceShownAtRef.current = {
      questionId,
      shownAt: Date.now(),
    };
  }, []);

  useSessionKeyboardShortcuts({
    sessionId,
    currentQuestion: s.currentQuestion,
    currentIndex: s.currentIndex,
    total: s.total,
    isShowingFeedback: s.isShowingFeedback,
    isCurrentAnswered: s.isCurrentAnswered,
    isWaitingForConfidence: s.isWaitingForConfidence,
    isPrzeglad,
    selectAndCheck: handleSelectOption,
    onNext: wrappedNavigateNext,
    onPrevious: wrappedPrevious,
    onConfidencePick: onConfidenceShortcut,
    disabled: Boolean(instantSummary),
  });

  if (instantSummary) {
    return <SessionSummaryClient summary={instantSummary} />;
  }

  if (!s.currentQuestion) {
    return null;
  }

  const q = s.currentQuestion;
  const currentFeedbackVariant =
    feedbackState?.questionId === q.id ? feedbackState.variant : "standard";
  const currentConceptIds = new Set(q.conceptIds ?? []);
  const transferScheduled =
    currentFeedbackVariant === "remedial" &&
    currentConceptIds.size > 0 &&
    s.questions
      .slice(s.currentIndex + 1, s.currentIndex + 4)
      .some((candidate) =>
        (candidate.conceptIds ?? []).some((id) => currentConceptIds.has(id)),
      );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <SessionSaveToast message={saveToast} onDismiss={dismissToast} />
      <SessionEndDialog
        open={endOpen}
        onOpenChange={setEndOpen}
        answeredCount={s.answeredCount}
        totalQuestions={s.total}
        onConfirm={wrappedEndConfirm}
      />
      <SessionTopBar
        subjectName={subjectName}
        current={s.currentIndex}
        total={s.total}
        mode={mode}
        examElapsedSeconds={showSessionTimer ? timerSec : null}
        selectedTopicName={selectedTopicName}
        sessionTopicNames={sessionTopicNames}
        questions={s.questions}
        answeredMap={s.answeredMap}
        onJumpTo={wrappedJumpTo}
        onEnd={() => setEndOpen(true)}
      />
      <SessionQuestionContent
        sessionId={sessionId}
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
        onJumpTo={wrappedJumpTo}
        onSelectOption={handleSelectOption}
        onConfidencePick={(c) => void wrappedConfidencePick(c)}
        onConfidenceBarShown={onConfidenceBarShown}
        onNext={wrappedNavigateNext}
        onPrevious={wrappedPrevious}
        showTopicName={showSessionTopics}
        subjectId={subjectId}
        product={product}
        feedbackVariant={currentFeedbackVariant}
        transferScheduled={transferScheduled}
        fatigueDetected={fatigueDetected}
        onTakeBreak={() => setEndOpen(true)}
        onFeedbackShown={onFeedbackShown}
        onFeedbackExpand={onFeedbackExpand}
      />
    </div>
  );
}
