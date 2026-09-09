"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Coffee } from "lucide-react";
import { FeedbackPanel } from "@/features/session/components/FeedbackPanel";
import { QuestionCard } from "@/features/session/components/QuestionCard";
import { SessionBottomBar } from "@/features/session/components/SessionBottomBar";
import { SessionQuestionOptions } from "@/features/session/components/SessionQuestionOptions";
import type { FeedbackVariant } from "@/features/session/lib/adaptiveFeedback";
import type {
  FeedbackExpandSection,
  FeedbackShownEvent,
} from "@/features/session/lib/feedbackTelemetry";
import {
  resolveSessionBottomBarMode,
  resolveSessionNextLabel,
  scrollSessionScroller,
  sessionOverlayChromePadding,
} from "@/features/session/lib/sessionBottomBar";
import { sessionOptionLetter } from "@/features/session/lib/sessionOptionOrder";
import { isLongSessionQuestion } from "@/features/session/lib/sessionQuestionCollapse";
import {
  feedbackVariants,
  questionVariants,
} from "@/features/session/lib/sessionMotion";
import { SessionQuestionActions } from "@/features/shared/components/QuestionFooterActions";
import { isExplanationHiddenForSubject } from "@/lib/content/subjectExplanationPolicy";
import { useTouchEdgeNavigation } from "@/features/session/hooks/useTouchEdgeNavigation";
import type {
  Confidence,
  SessionAnswer,
  SessionQuestion,
} from "@/features/session/types";
import { cn } from "@/lib/utils";

type SessionQuestionContentProps = {
  sessionId: string;
  q: SessionQuestion;
  currentIndex: number;
  total: number;
  selectedOptionId: string | null;
  isShowingFeedback: boolean;
  isCurrentAnswered: boolean;
  isWaitingForConfidence: boolean;
  allAnswered: boolean;
  isPrzeglad: boolean;
  submitting?: boolean;
  questions?: SessionQuestion[];
  answeredMap?: Record<string, SessionAnswer>;
  onJumpTo?: (idx: number) => void;
  onSelectOption: (id: string) => void;
  onConfidencePick: (c: Confidence) => void;
  onNext: () => void;
  onPrevious: () => void;
  onConfidenceBarShown?: (questionId: string) => void;
  showTopicName?: boolean;
  subjectId: string;
  product?: string | null;
  feedbackVariant: FeedbackVariant;
  transferScheduled?: boolean;
  fatigueDetected?: boolean;
  onTakeBreak?: () => void;
  onFeedbackShown?: (event: FeedbackShownEvent) => void;
  onFeedbackExpand?: (
    questionId: string,
    section: FeedbackExpandSection,
  ) => void;
};

export function SessionQuestionContent({
  sessionId,
  q,
  currentIndex,
  total,
  selectedOptionId,
  isShowingFeedback,
  isCurrentAnswered,
  isWaitingForConfidence,
  allAnswered,
  isPrzeglad,
  submitting,
  answeredMap,
  onSelectOption,
  onConfidencePick,
  onNext,
  onPrevious,
  onConfidenceBarShown,
  showTopicName = true,
  subjectId,
  product,
  feedbackVariant,
  transferScheduled,
  fatigueDetected = false,
  onTakeBreak,
  onFeedbackShown,
  onFeedbackExpand,
}: SessionQuestionContentProps) {
  const t = useTranslations("session");
  const reduceMotion = useReducedMotion();
  const hideExplanation = isExplanationHiddenForSubject(subjectId);
  const isCorrect =
    selectedOptionId != null && selectedOptionId === q.correctOptionId;
  const isLast = currentIndex >= total - 1;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const [questionOpen, setQuestionOpen] = useState(true);
  const canCollapseQuestion = isShowingFeedback && isLongSessionQuestion(q);
  const orderCtx = {
    disableOptionShuffle: q.disableOptionShuffle,
    explanation: q.explanation,
  };
  const selectedLetter = selectedOptionId
    ? sessionOptionLetter(sessionId, q.id, q.options, selectedOptionId, orderCtx)
    : "";
  const correctLetter = sessionOptionLetter(
    sessionId,
    q.id,
    q.options,
    q.correctOptionId,
    orderCtx,
  );

  const barMode = resolveSessionBottomBarMode({
    isPrzeglad,
    isWaitingForConfidence,
    isShowingFeedback,
  });
  const canEndPrzeglad = isPrzeglad && isLast;
  const canGoNextTouch =
    barMode !== "confidence" &&
    (isLast ? allAnswered || isShowingFeedback || canEndPrzeglad : true);

  const nextLabel = resolveSessionNextLabel({
    isLast,
    allAnswered,
    canEndPrzeglad,
    continueLabel: t("continue"),
    summaryLabel: t("viewSummary"),
  });

  const canGoPrevious = currentIndex > 0;

  useTouchEdgeNavigation({
    onPrevious,
    onNext,
    canPrevious: canGoPrevious,
    canNext: canGoNextTouch,
  });

  useEffect(() => {
    const chrome = chromeRef.current;
    const scroller = scrollerRef.current;
    if (!chrome || !scroller) return;

    const apply = () => {
      const overlay = !window.matchMedia("(min-width: 1024px)").matches;
      scroller.style.setProperty(
        "--session-bottom-chrome",
        sessionOverlayChromePadding(chrome.offsetHeight, overlay),
      );
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(chrome);
    const mq = window.matchMedia("(min-width: 1024px)");
    mq.addEventListener("change", apply);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", apply);
    };
  }, [barMode]);

  useEffect(() => {
    setQuestionOpen(true);
  }, [q.id]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (isShowingFeedback) {
      const verdict = scroller.querySelector<HTMLElement>(
        "[data-session-verdict]",
      );
      const header = document.querySelector<HTMLElement>("[data-session-topbar]");
      verdict?.focus({ preventScroll: true });
      scrollSessionScroller(
        scroller,
        verdict,
        header?.getBoundingClientRect().height ?? 0,
      );
      return;
    }
    const stem = scroller.querySelector<HTMLElement>(
      "[data-session-question-stem]",
    );
    const card = scroller.querySelector<HTMLElement>(
      "[data-session-question-card]",
    );
    stem?.focus({ preventScroll: true });
    scrollSessionScroller(scroller, card, 0);
  }, [q.id, isShowingFeedback]);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollerRef}
        data-session-scroller
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 pb-[var(--session-bottom-chrome,1.5rem)] pt-4 touch-pan-y sm:px-8 sm:pt-5 lg:pb-6"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            variants={reduceMotion ? undefined : questionVariants}
            initial={reduceMotion ? false : "enter"}
            animate={reduceMotion ? undefined : "center"}
            exit={reduceMotion ? undefined : "exit"}
          >
            {canCollapseQuestion ? (
              <div className="mx-auto w-full max-w-3xl md:max-w-[72ch]">
                <button
                  type="button"
                  aria-expanded={questionOpen}
                  aria-controls="session-question-body"
                  onClick={() => setQuestionOpen((open) => !open)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-btn px-1 py-1 text-left"
                >
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-secondary motion-reduce:transition-none transition-transform",
                      questionOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                  <span className="font-body text-[13px] font-semibold text-secondary md:text-[14px]">
                    {t("questionAndAnswers")}
                  </span>
                </button>
                {questionOpen ? null : (
                  <p className="mt-1 px-1 font-body text-body-sm text-secondary">
                    {t("questionAndAnswersSummary", {
                      selected: selectedLetter,
                      correct: correctLetter,
                    })}
                  </p>
                )}
              </div>
            ) : null}
            {canCollapseQuestion && !questionOpen ? null : (
              <div id="session-question-body">
                <QuestionCard
                  question={q}
                  showTopicName={showTopicName}
                  product={product}
                >
                  <SessionQuestionOptions
                    sessionId={sessionId}
                    q={q}
                    selectedOptionId={selectedOptionId}
                    isShowingFeedback={isShowingFeedback || isCurrentAnswered}
                    optionsLocked={isShowingFeedback || isCurrentAnswered}
                    onSelectOption={onSelectOption}
                  />
                </QuestionCard>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {isShowingFeedback ? (
          <motion.div
            key={`fb-${q.id}`}
            variants={reduceMotion ? undefined : feedbackVariants}
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "visible"}
            className="mx-auto w-full max-w-3xl md:max-w-[72ch]"
          >
            <FeedbackPanel
              sessionId={sessionId}
              question={q}
              selectedOptionId={selectedOptionId!}
              isCorrect={isCorrect}
              hideExplanation={hideExplanation}
              variant={feedbackVariant}
              transferScheduled={transferScheduled}
              confidence={answeredMap?.[q.id]?.confidence ?? null}
              onFeedbackShown={onFeedbackShown}
              onFeedbackExpand={onFeedbackExpand}
            />
            {fatigueDetected ? (
              <div className="mt-5 flex items-start gap-3 rounded-card border border-brand-sage/25 bg-brand-sage/[0.06] p-4">
                <Coffee
                  className="mt-0.5 size-5 shrink-0 text-secondary"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-body-sm font-semibold text-primary">
                    {t("fatigueTitle")}
                  </p>
                  <p className="mt-1 font-body text-body-xs leading-relaxed text-secondary">
                    {t("fatigueDescription")}
                  </p>
                  {onTakeBreak ? (
                    <button
                      type="button"
                      onClick={onTakeBreak}
                      className="mt-3 rounded-btn border border-border px-3 py-2 font-body text-body-xs font-semibold text-secondary transition-colors hover:bg-white/5"
                    >
                      {t("fatigueTakeBreak")}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </motion.div>
        ) : null}

        <div className="mx-auto mt-5 w-full max-w-3xl border-t border-border pt-2 md:max-w-[72ch]">
          <SessionQuestionActions
            questionId={q.id}
            questionText={q.text}
            subjectId={subjectId}
            variant="icons"
          />
        </div>
      </div>

      <div
        ref={chromeRef}
        data-session-bottom-chrome
        className={cn(
          "z-40 shrink-0 border-t border-border bg-background/95 backdrop-blur-sm max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 lg:sticky lg:bottom-0",
          barMode === "hidden" && "pointer-events-none max-lg:border-transparent",
        )}
      >
        <div className={barMode === "hidden" ? "pointer-events-none" : "pointer-events-auto"}>
          <SessionBottomBar
            mode={barMode}
            questionId={q.id}
            submitting={submitting}
            nextLabel={nextLabel}
            onConfidencePick={onConfidencePick}
            onNext={onNext}
            onConfidenceBarShown={onConfidenceBarShown}
          />
        </div>
        <div className="h-[env(safe-area-inset-bottom)] lg:hidden" />
      </div>
    </div>
  );
}
