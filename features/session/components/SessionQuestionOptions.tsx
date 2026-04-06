"use client";

import { motion } from "framer-motion";
import { AnswerOption } from "@/features/session/components/AnswerOption";
import {
  optionVariants,
  optionsContainerVariants,
} from "@/features/session/lib/sessionMotion";
import { optionVisualState } from "@/features/session/lib/optionVisualState";
import type { SessionQuestion } from "@/features/session/types";

type SessionQuestionOptionsProps = {
  q: SessionQuestion;
  selectedOptionId: string | null;
  isShowingFeedback: boolean;
  onSelectOption: (id: string) => void;
};

export function SessionQuestionOptions({
  q,
  selectedOptionId,
  isShowingFeedback,
  onSelectOption,
}: SessionQuestionOptionsProps) {
  return (
    <motion.div variants={optionsContainerVariants} initial="hidden" animate="visible">
      {q.options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const state = optionVisualState(
          opt.id,
          q,
          isShowingFeedback,
          selectedOptionId,
        );
        const showPulse = isShowingFeedback && opt.id === q.correctOptionId;
        const showShake =
          isShowingFeedback &&
          opt.id === selectedOptionId &&
          selectedOptionId !== q.correctOptionId;

        return (
          <motion.div key={opt.id} variants={optionVariants}>
            <motion.div
              animate={
                showPulse ? { scale: [1, 1.02, 1] } : showShake ? { x: [0, -4, 4, -2, 0] } : {}
              }
              transition={
                showPulse ? { duration: 0.3 } : showShake ? { duration: 0.4 } : { duration: 0 }
              }
            >
              <AnswerOption
                letter={letter}
                text={opt.text}
                state={state}
                disabled={isShowingFeedback}
                onSelect={() => onSelectOption(opt.id)}
              />
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
