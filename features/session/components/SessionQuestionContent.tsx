"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, Coffee } from "lucide-react";
import { FeedbackPanel } from "@/features/session/components/FeedbackPanel";
import { QuestionCard } from "@/features/session/components/QuestionCard";
import { SessionBottomBar } from "@/features/session/components/SessionBottomBar";
import { SessionProgressSquares } from "@/features/session/components/SessionProgressSquares";
import { SessionQuestionOptions } from "@/features/session/components/SessionQuestionOptions";
import type { FeedbackVariant } from "@/features/session/lib/adaptiveFeedback";
import type {
  FeedbackExpandSection,
  FeedbackShownEvent,
} from "@/features/session/lib/feedbackTelemetry";
import {
  resolveSessionBottomBarMode,
  scrollSessionScroller,
} from "@/features/session/lib/sessionBottomBar";
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
  questions,
  answeredMap,
  onJumpTo,
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
  const hideExplanation = isExplanationHiddenForSubject(subjectId);
  const isCorrect =
    selectedOptionId != null && selectedOptionId === q.correctOptionId;
  const isLast = currentIndex >= total - 1;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);

  const barMode = resolveSessionBottomBarMode({
    isPrzeglad,
    isWaitingForConfidence,
    isShowingFeedback,
  });
  const canEndPrzeglad = isPrzeglad && isLast;
  const canGoNextTouch =
    barMode !== "confidence" &&
    (isLast ? allAnswered || isShowingFeedback || canEndPrzeglad : true);

  const nextLabel =
    allAnswered || canEndPrzeglad ? t("endSession") : t("continue");

  const showSquares =
    questions != null && answeredMap != null && questions.length > 0;

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
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      scroller.style.setProperty(
        "--session-bottom-chrome",
        desktop ? "0px" : `${chrome.offsetHeight + 8}px`,
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
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (isShowingFeedback) {
      const verdict = scroller.querySelector<HTMLElement>(
        "[data-session-verdict]",
      );
      const header = document.querySelector<HTMLElement>("[data-session-topbar]");
      scrollSessionScroller(
        scroller,
        verdict,
        header?.getBoundingClientRect().height ?? 0,
      );
      return;
    }
    const card = scroller.querySelector<HTMLElement>(
      "[data-session-question-card]",
    );
    scrollSessionScroller(scroller, card, 0);
  }, [q.id, isShowingFeedback]);

  const navBtnClass = cn(
    "inline-flex shrink-0 items-center justify-center rounded-btn border border-border font-body font-medium text-secondary transition-colors",
    "hover:border-brand-sage/40 hover:bg-white/5 hover:text-primary",
    "disabled:pointer-events-none disabled:opacity-30",
  );

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollerRef}
        data-session-scroller
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 pb-[var(--session-bottom-chrome,1.5rem)] pt-4 touch-pan-y sm:px-8 sm:pt-6 lg:pb-6"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            variants={questionVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
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
                optionsLocked={
                  selectedOptionId != null ||
                  isShowingFeedback ||
                  isCurrentAnswered
                }
                onSelectOption={onSelectOption}
              />
            </QuestionCard>
          </motion.div>
        </AnimatePresence>

        {isShowingFeedback ? (
          <motion.div
            key={`fb-${q.id}`}
            variants={feedbackVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto w-full max-w-3xl"
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
            <SessionQuestionActions
              questionId={q.id}
              questionText={q.text}
              subjectId={subjectId}
            />

            {fatigueDetected ? (
              <div className="mt-6 flex items-start gap-3 rounded-card border border-brand-gold/25 bg-brand-gold/[0.06] p-4">
                <Coffee
                  className="mt-0.5 size-5 shrink-0 text-brand-gold"
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
                      className="mt-3 rounded-btn border border-brand-gold/30 px-3 py-2 font-body text-body-xs font-semibold text-brand-gold transition-colors hover:bg-brand-gold/10"
                    >
                      {t("fatigueTakeBreak")}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </motion.div>
        ) : (
          <div className="mx-auto mt-8 w-full max-w-3xl">
            <SessionQuestionActions
              questionId={q.id}
              questionText={q.text}
              subjectId={subjectId}
            />
          </div>
        )}
      </div>

      <div
        ref={chromeRef}
        data-session-bottom-chrome
        className="z-40 shrink-0 bg-background/95 backdrop-blur-sm max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 lg:sticky lg:bottom-0"
      >
        <div className="border-t border-border px-2 py-1.5 sm:px-4 sm:py-3">
          <div className="mx-auto flex max-w-3xl items-center gap-1 lg:hidden">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={onPrevious}
              className={cn(navBtnClass, "size-11")}
              aria-label={t("previous")}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            {showSquares ? (
              <div className="min-w-0 flex-1">
                <SessionProgressSquares
                  questions={questions!}
                  answeredMap={answeredMap!}
                  currentIndex={currentIndex}
                  onJumpTo={onJumpTo}
                />
              </div>
            ) : (
              <p className="min-w-0 flex-1 text-center font-body text-body-xs tabular-nums text-secondary">
                {currentIndex + 1}/{total}
              </p>
            )}
          </div>

          <div className="mx-auto hidden max-w-3xl lg:block">
            {showSquares ? (
              <div className="mb-2">
                <SessionProgressSquares
                  questions={questions!}
                  answeredMap={answeredMap!}
                  currentIndex={currentIndex}
                  onJumpTo={onJumpTo}
                />
              </div>
            ) : null}
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={onPrevious}
              className={cn(navBtnClass, "gap-1.5 px-4 py-2.5 text-body-sm")}
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              {t("previous")}
            </button>
          </div>
        </div>

        <SessionBottomBar
          mode={barMode}
          questionId={q.id}
          submitting={submitting}
          nextLabel={nextLabel}
          onConfidencePick={onConfidencePick}
          onNext={onNext}
          onConfidenceBarShown={onConfidenceBarShown}
        />
        <div className="h-[env(safe-area-inset-bottom)] lg:hidden" />
      </div>
    </div>
  );
}
