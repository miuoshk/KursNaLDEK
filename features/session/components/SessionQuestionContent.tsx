"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeedbackPanel } from "@/features/session/components/FeedbackPanel";
import { QuestionCard } from "@/features/session/components/QuestionCard";
import { SessionProgressSquares } from "@/features/session/components/SessionProgressSquares";
import { SessionQuestionOptions } from "@/features/session/components/SessionQuestionOptions";
import { feedbackVariants, questionVariants } from "@/features/session/lib/sessionMotion";
import { SessionQuestionActions } from "@/features/shared/components/QuestionFooterActions";
import { SessionEdgeTapZones } from "@/features/session/components/SessionEdgeTapZones";
import { useTouchEdgeNavigation } from "@/features/session/hooks/useTouchEdgeNavigation";
import type {
  Confidence,
  SessionAnswer,
  SessionQuestion,
} from "@/features/session/types";
import { cn } from "@/lib/utils";

type SessionQuestionContentProps = {
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
};

export function SessionQuestionContent({
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
}: SessionQuestionContentProps) {
  const isCorrect =
    selectedOptionId != null && selectedOptionId === q.correctOptionId;
  const isLast = currentIndex >= total - 1;

  const showConfidenceBar = isWaitingForConfidence && !isPrzeglad;
  const canEndPrzeglad = isPrzeglad && isLast;
  const canNavigateNext =
    !showConfidenceBar &&
    (isLast ? allAnswered || isShowingFeedback || canEndPrzeglad : true);

  let nextLabel = "Następne";
  if (allAnswered || canEndPrzeglad) {
    nextLabel = "Zakończ sesję";
  } else if (!isShowingFeedback && !isCurrentAnswered) {
    nextLabel = "Pomiń";
  }

  const showSquares =
    isPrzeglad && questions != null && answeredMap != null && questions.length > 0;

  const canGoPrevious = currentIndex > 0;
  const canGoNextTouch =
    !showConfidenceBar &&
    (isLast ? allAnswered || isShowingFeedback || canEndPrzeglad : true);

  const { touchNavActive, onEdgePrevious, onEdgeNext } = useTouchEdgeNavigation({
    onPrevious,
    onNext,
    canPrevious: canGoPrevious,
    canNext: canGoNextTouch,
  });

  return (
    <>
      <SessionEdgeTapZones
        active={touchNavActive}
        canPrevious={canGoPrevious}
        canNext={canGoNextTouch}
        onPrevious={onEdgePrevious}
        onNext={onEdgeNext}
      />
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-6 sm:px-8">
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
              question={q}
              selectedOptionId={selectedOptionId!}
              isCorrect={isCorrect}
            />
            <SessionQuestionActions questionId={q.id} questionText={q.text} />

            {showConfidenceBar ? (
              <div className="mt-6 flex flex-col items-center gap-3">
                <p className="font-body text-body-xs text-secondary">
                  Jak dobrze znałeś odpowiedź?
                </p>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onConfidencePick("nie_wiedzialem")}
                    className="flex-1 rounded-btn border border-error/20 bg-error/[0.08] px-3 py-2.5 font-body text-body-xs font-medium text-error transition hover:border-error/40 hover:bg-error/[0.15] disabled:cursor-not-allowed disabled:opacity-50 sm:text-body-sm"
                  >
                    Nie wiedziałem
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onConfidencePick("troche")}
                    className="flex-1 rounded-btn border border-brand-gold/20 bg-brand-gold/[0.08] px-3 py-2.5 font-body text-body-xs font-medium text-brand-gold transition hover:border-brand-gold/40 hover:bg-brand-gold/[0.15] disabled:cursor-not-allowed disabled:opacity-50 sm:text-body-sm"
                  >
                    {submitting ? "Zapisywanie..." : "Trochę wiedziałem"}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onConfidencePick("na_pewno")}
                    className="flex-1 rounded-btn border border-success/20 bg-success/[0.08] px-3 py-2.5 font-body text-body-xs font-medium text-success transition hover:border-success/40 hover:bg-success/[0.15] disabled:cursor-not-allowed disabled:opacity-50 sm:text-body-sm"
                  >
                    Wiedziałem na pewno
                  </button>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => onConfidencePick("troche")}
                  className="font-body text-body-xs text-muted transition-colors hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Pomiń ocenę
                </button>
              </div>
            ) : null}
          </motion.div>
        ) : (
          <div className="mx-auto mt-8 w-full max-w-3xl">
            <SessionQuestionActions questionId={q.id} questionText={q.text} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        {showSquares ? (
          <div className="mx-auto mb-2 max-w-3xl">
            <SessionProgressSquares
              questions={questions!}
              answeredMap={answeredMap!}
              currentIndex={currentIndex}
              onJumpTo={onJumpTo}
            />
          </div>
        ) : null}
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            type="button"
            disabled={currentIndex <= 0}
            onClick={onPrevious}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-btn border border-border px-4 py-2.5 font-body text-body-sm font-medium text-secondary transition-colors",
              "hover:border-brand-sage/40 hover:bg-white/5 hover:text-primary",
              "disabled:pointer-events-none disabled:opacity-30",
            )}
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            Poprzednie
          </button>

          <p className="font-body text-body-xs text-secondary">
            {currentIndex + 1} / {total}
          </p>

          <button
            type="button"
            disabled={!canNavigateNext}
            onClick={onNext}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-btn border border-border px-4 py-2.5 font-body text-body-sm font-medium text-secondary transition-colors",
              "hover:border-brand-sage/40 hover:bg-white/5 hover:text-primary",
              (allAnswered || canEndPrzeglad) &&
                "border-brand-gold/40 text-brand-gold hover:border-brand-gold hover:bg-brand-gold/10 hover:text-brand-gold",
              "disabled:pointer-events-none disabled:opacity-30",
            )}
          >
            {nextLabel}
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </button>
        </div>
      </div>
    </>
  );
}
