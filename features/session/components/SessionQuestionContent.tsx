"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeedbackPanel } from "@/features/session/components/FeedbackPanel";
import { QuestionCard } from "@/features/session/components/QuestionCard";
import { SessionQuestionOptions } from "@/features/session/components/SessionQuestionOptions";
import { feedbackVariants, questionVariants } from "@/features/session/lib/sessionMotion";
import { SessionQuestionActions } from "@/features/shared/components/QuestionFooterActions";
import type { SessionQuestion } from "@/features/session/types";
import { cn } from "@/lib/utils";

type SessionQuestionContentProps = {
  q: SessionQuestion;
  currentIndex: number;
  total: number;
  selectedOptionId: string | null;
  isShowingFeedback: boolean;
  isCurrentAnswered: boolean;
  allAnswered: boolean;
  onSelectOption: (id: string) => void;
  onNext: () => void;
  onPrevious: () => void;
};

export function SessionQuestionContent({
  q,
  currentIndex,
  total,
  selectedOptionId,
  isShowingFeedback,
  isCurrentAnswered,
  allAnswered,
  onSelectOption,
  onNext,
  onPrevious,
}: SessionQuestionContentProps) {
  const isCorrect =
    selectedOptionId != null && selectedOptionId === q.correctOptionId;
  const isLast = currentIndex >= total - 1;

  let nextLabel = "Następne";
  if (allAnswered) {
    nextLabel = "Zakończ sesję";
  } else if (!isShowingFeedback && !isCurrentAnswered) {
    nextLabel = "Pomiń";
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-6 sm:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            variants={questionVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <QuestionCard question={q}>
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
          </motion.div>
        ) : (
          <div className="mx-auto mt-8 w-full max-w-3xl">
            <SessionQuestionActions questionId={q.id} questionText={q.text} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            type="button"
            disabled={currentIndex <= 0}
            onClick={onPrevious}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-btn px-4 py-2.5 font-body text-body-sm font-medium text-secondary transition-colors",
              "hover:bg-white/5 hover:text-primary",
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
            disabled={isLast && !allAnswered && !isShowingFeedback}
            onClick={onNext}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-btn px-4 py-2.5 font-body text-body-sm font-semibold transition",
              allAnswered
                ? "bg-brand-gold text-brand-bg hover:brightness-110"
                : "bg-brand-sage text-white hover:bg-[#4a9085]",
              "disabled:pointer-events-none disabled:opacity-30",
            )}
          >
            {nextLabel}
            {!allAnswered && <ChevronRight className="size-4 shrink-0" aria-hidden />}
          </button>
        </div>
      </div>
    </>
  );
}
