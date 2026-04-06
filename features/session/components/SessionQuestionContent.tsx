"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ConfidenceRating } from "@/features/session/components/ConfidenceRating";
import { FeedbackPanel } from "@/features/session/components/FeedbackPanel";
import { QuestionCard } from "@/features/session/components/QuestionCard";
import { SessionBottomBar } from "@/features/session/components/SessionBottomBar";
import { SessionQuestionOptions } from "@/features/session/components/SessionQuestionOptions";
import { feedbackVariants, questionVariants } from "@/features/session/lib/sessionMotion";
import type { Confidence, SessionQuestion } from "@/features/session/types";
import { cn } from "@/lib/utils";

type SessionQuestionContentProps = {
  q: SessionQuestion;
  currentIndex: number;
  total: number;
  selectedOptionId: string | null;
  isShowingFeedback: boolean;
  confidence: Confidence | null;
  onSelectOption: (id: string) => void;
  onConfidence: (c: Confidence) => void;
  onCheck: () => void;
  onNext: () => void;
};

export function SessionQuestionContent({
  q,
  currentIndex,
  total,
  selectedOptionId,
  isShowingFeedback,
  confidence,
  onSelectOption,
  onConfidence,
  onCheck,
  onNext,
}: SessionQuestionContentProps) {
  const isCorrect =
    selectedOptionId != null && selectedOptionId === q.correctOptionId;

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
                isShowingFeedback={isShowingFeedback}
                onSelectOption={onSelectOption}
              />
            </QuestionCard>
          </motion.div>
        </AnimatePresence>

        {!isShowingFeedback ? (
          <div className="mx-auto mt-8 w-full max-w-3xl">
            <button
              type="button"
              disabled={!selectedOptionId}
              onClick={onCheck}
              className={cn(
                "w-full rounded-btn bg-brand-gold py-3.5 font-body text-body-md font-semibold text-brand-bg transition duration-200 ease-out",
                "hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              Sprawdź odpowiedź
            </button>
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
            <ConfidenceRating
              value={confidence}
              onChange={onConfidence}
              disabled={false}
            />
          </motion.div>
        )}
      </div>

      {isShowingFeedback ? (
        <SessionBottomBar
          current={currentIndex}
          total={total}
          canContinue={confidence !== null}
          onNext={onNext}
        />
      ) : null}
    </>
  );
}
