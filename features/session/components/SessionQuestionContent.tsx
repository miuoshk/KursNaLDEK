"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { FeedbackPanel } from "@/features/session/components/FeedbackPanel";
import { QuestionCard } from "@/features/session/components/QuestionCard";
import { SessionConfidenceBar } from "@/features/session/components/SessionConfidenceBar";
import { SessionQuestionActions } from "@/features/session/components/SessionQuestionActions";
import { SessionQuestionOptions } from "@/features/session/components/SessionQuestionOptions";
import { feedbackVariants, questionVariants } from "@/features/session/lib/sessionMotion";
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
}: SessionQuestionContentProps) {
  const isCorrect =
    selectedOptionId != null && selectedOptionId === q.correctOptionId;
  const isPrzeglad = mode === "przeglad";

  return (
    <>
      <div className="mx-auto max-w-3xl flex-1 overflow-y-auto px-4 pb-40 pt-6 sm:px-8">
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
          <div className="mt-8 space-y-4">
            {currentIndex > 0 ? (
              <button
                type="button"
                onClick={onGoToPrevious}
                className="inline-flex items-center gap-1.5 font-body text-body-sm text-secondary transition-colors hover:text-white"
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
                "w-full rounded-btn py-3.5 font-body text-body-md font-semibold transition duration-200 ease-out",
                selectedOptionId
                  ? "cursor-pointer bg-brand-gold text-brand-bg hover:brightness-110"
                  : "cursor-not-allowed bg-brand-card-1 text-muted",
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
            className="mt-8"
          >
            <FeedbackPanel
              question={q}
              selectedOptionId={selectedOptionId!}
              isCorrect={isCorrect}
            />
            <SessionQuestionActions questionId={q.id} questionText={q.text} />
            {isPrzeglad && (
              <button
                type="button"
                onClick={onPrzegladNext}
                className="mt-6 w-full rounded-btn bg-brand-sage py-3.5 font-body text-body-md font-semibold text-white transition hover:brightness-110"
              >
                Dalej
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
          onContinueReview={onContinueReview}
        />
      ) : null}
    </>
  );
}
