"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeedbackPanel } from "@/features/session/components/FeedbackPanel";
import { QuestionCard } from "@/features/session/components/QuestionCard";
import { SessionConfidenceBar } from "@/features/session/components/SessionConfidenceBar";
import { SessionQuestionOptions } from "@/features/session/components/SessionQuestionOptions";
import { feedbackVariants, questionVariants } from "@/features/session/lib/sessionMotion";
import { SessionQuestionActions } from "@/features/shared/components/QuestionFooterActions";
import type { Confidence, SessionMode, SessionQuestion } from "@/features/session/types";
import { cn } from "@/lib/utils";

type SessionQuestionContentProps = {
  q: SessionQuestion;
  currentIndex: number;
  total: number;
  selectedOptionId: string | null;
  isShowingFeedback: boolean;
  isPastReadOnly: boolean;
  mode: SessionMode;
  onSelectOption: (id: string) => void;
  onCheck: () => void;
  onConfidenceAndNext: (c: Confidence) => void;
  onPrzegladNext: () => void;
  onContinueReview: () => void;
  onGoToPrevious: () => void;
  submitting?: boolean;
};

export function SessionQuestionContent({
  q,
  currentIndex,
  total,
  selectedOptionId,
  isShowingFeedback,
  isPastReadOnly,
  mode,
  onSelectOption,
  onCheck,
  onConfidenceAndNext,
  onPrzegladNext,
  onContinueReview,
  onGoToPrevious,
  submitting,
}: SessionQuestionContentProps) {
  const isCorrect =
    selectedOptionId != null && selectedOptionId === q.correctOptionId;
  const isPrzeglad = mode === "przeglad";

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
                isShowingFeedback={isShowingFeedback || isPastReadOnly}
                onSelectOption={onSelectOption}
              />
            </QuestionCard>
          </motion.div>
        </AnimatePresence>

        {!isShowingFeedback ? (
          <div className="mx-auto mt-8 w-full max-w-3xl space-y-4">
            {currentIndex > 0 ? (
              <button
                type="button"
                onClick={onGoToPrevious}
                className="inline-flex items-center gap-1.5 font-body text-body-sm text-secondary transition-colors hover:text-primary"
              >
                <ChevronLeft className="size-4 shrink-0" aria-hidden />
                Poprzednie
              </button>
            ) : null}
            <button
              type="button"
              disabled={!selectedOptionId}
              onClick={onCheck}
              className={cn(
                "w-full rounded-btn bg-brand-sage py-3.5 font-body text-body-md font-semibold text-white transition duration-200 ease-out",
                "hover:bg-[#4a9085] disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              Sprawdź odpowiedź
            </button>
            <SessionQuestionActions questionId={q.id} questionText={q.text} />
          </div>
        ) : (
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
            {isPrzeglad ? (
              <button
                type="button"
                onClick={onPrzegladNext}
                className="mt-6 w-full rounded-btn bg-brand-sage py-3.5 font-body text-body-md font-semibold text-white transition hover:brightness-110"
              >
                Dalej
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => onConfidenceAndNext("troche")}
                className={cn(
                  "mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-btn bg-brand-sage py-3.5 font-body text-body-md font-semibold text-white transition hover:brightness-110",
                  "pointer-fine:hidden",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                Dalej
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              </button>
            )}
          </motion.div>
        )}
      </div>

      {isShowingFeedback && !isPrzeglad ? (
        <SessionConfidenceBar
          current={currentIndex}
          total={total}
          isPastReadOnly={isPastReadOnly}
          canGoPrevious={currentIndex > 0}
          onGoPrevious={onGoToPrevious}
          onConfidence={onConfidenceAndNext}
          disabled={submitting}
          onContinueReview={onContinueReview}
        />
      ) : null}
    </>
  );
}
