"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeedbackPanel } from "@/features/session/components/FeedbackPanel";
import { QuestionCard } from "@/features/session/components/QuestionCard";
import { SessionProgressSquares } from "@/features/session/components/SessionProgressSquares";
import { SessionQuestionOptions } from "@/features/session/components/SessionQuestionOptions";
import { feedbackVariants, questionVariants } from "@/features/session/lib/sessionMotion";
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
  showTopicName?: boolean;
  subjectId: string;
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
  showTopicName = true,
  subjectId,
}: SessionQuestionContentProps) {
  const t = useTranslations("session");
  const hideExplanation = isExplanationHiddenForSubject(subjectId);
  const isCorrect =
    selectedOptionId != null && selectedOptionId === q.correctOptionId;
  const isLast = currentIndex >= total - 1;

  const showConfidenceBar = isWaitingForConfidence && !isPrzeglad;
  const canEndPrzeglad = isPrzeglad && isLast;
  const canNavigateNext =
    !showConfidenceBar &&
    (isLast ? allAnswered || isShowingFeedback || canEndPrzeglad : true);

  let nextLabel = t("next");
  if (allAnswered || canEndPrzeglad) {
    nextLabel = t("endSession");
  } else if (!isShowingFeedback && !isCurrentAnswered) {
    nextLabel = t("skip");
  }

  const showSquares =
    questions != null && answeredMap != null && questions.length > 0;

  const canGoPrevious = currentIndex > 0;
  const canGoNextTouch =
    !showConfidenceBar &&
    (isLast ? allAnswered || isShowingFeedback || canEndPrzeglad : true);

  useTouchEdgeNavigation({
    onPrevious,
    onNext,
    canPrevious: canGoPrevious,
    canNext: canGoNextTouch,
  });

  const navBtnClass = cn(
    "inline-flex shrink-0 items-center justify-center rounded-btn border border-border font-body font-medium text-secondary transition-colors",
    "hover:border-brand-sage/40 hover:bg-white/5 hover:text-primary",
    "disabled:pointer-events-none disabled:opacity-30",
  );

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 pb-6 pt-4 touch-pan-y sm:px-8 sm:pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            variants={questionVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <QuestionCard question={q} showTopicName={showTopicName}>
              <SessionQuestionOptions
                sessionId={sessionId}
                q={q}
                selectedOptionId={selectedOptionId}
                isShowingFeedback={isShowingFeedback || isCurrentAnswered}
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
            />
            <SessionQuestionActions
              questionId={q.id}
              questionText={q.text}
              subjectId={subjectId}
            />

            {showConfidenceBar ? (
              <div className="mt-6 flex flex-col items-center gap-3">
                <p className="font-body text-body-xs text-secondary">
                  {t("howWellKnown")}
                </p>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onConfidencePick("nie_wiedzialem")}
                    className="flex-1 rounded-btn border border-error/20 bg-error/[0.08] px-3 py-2.5 font-body text-body-xs font-medium text-error transition hover:border-error/40 hover:bg-error/[0.15] disabled:cursor-not-allowed disabled:opacity-50 sm:text-body-sm"
                  >
                    {t("didNotKnow")}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onConfidencePick("troche")}
                    className="flex-1 rounded-btn border border-brand-gold/20 bg-brand-gold/[0.08] px-3 py-2.5 font-body text-body-xs font-medium text-brand-gold transition hover:border-brand-gold/40 hover:bg-brand-gold/[0.15] disabled:cursor-not-allowed disabled:opacity-50 sm:text-body-sm"
                  >
                    {submitting ? t("saving") : t("knewSomewhat")}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onConfidencePick("na_pewno")}
                    className="flex-1 rounded-btn border border-success/20 bg-success/[0.08] px-3 py-2.5 font-body text-body-xs font-medium text-success transition hover:border-success/40 hover:bg-success/[0.15] disabled:cursor-not-allowed disabled:opacity-50 sm:text-body-sm"
                  >
                    {t("knewForSure")}
                  </button>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => onConfidencePick("troche")}
                  className="font-body text-body-xs text-muted transition-colors hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("skipRating")}
                </button>
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

      <div className="z-40 shrink-0 border-t border-border bg-background/95 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-4 sm:py-3 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl items-center gap-1 sm:hidden">
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
          <button
            type="button"
            disabled={!canNavigateNext}
            onClick={onNext}
            className={cn(
              navBtnClass,
              "size-11",
              (allAnswered || canEndPrzeglad) &&
                "border-brand-gold/40 text-brand-gold hover:border-brand-gold hover:bg-brand-gold/10 hover:text-brand-gold",
            )}
            aria-label={nextLabel}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        <div className="mx-auto hidden max-w-3xl sm:block">
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
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={onPrevious}
              className={cn(navBtnClass, "gap-1.5 px-4 py-2.5 text-body-sm")}
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              {t("previous")}
            </button>

            <p className="font-body text-body-xs text-secondary">
              {t("questionProgress", { current: currentIndex + 1, total })}
            </p>

            <button
              type="button"
              disabled={!canNavigateNext}
              onClick={onNext}
              className={cn(
                navBtnClass,
                "gap-1.5 px-4 py-2.5 text-body-sm",
                (allAnswered || canEndPrzeglad) &&
                  "border-brand-gold/40 text-brand-gold hover:border-brand-gold hover:bg-brand-gold/10 hover:text-brand-gold",
              )}
            >
              {nextLabel}
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
