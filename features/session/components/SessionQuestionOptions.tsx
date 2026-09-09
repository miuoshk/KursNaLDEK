"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AnswerOption } from "@/features/session/components/AnswerOption";
import { useSessionOptionOrder } from "@/features/session/hooks/useSessionOptionOrder";
import {
  optionVariants,
  optionsContainerVariants,
} from "@/features/session/lib/sessionMotion";
import { optionVisualState } from "@/features/session/lib/optionVisualState";
import type { SessionQuestion } from "@/features/session/types";

type SessionQuestionOptionsProps = {
  sessionId: string;
  q: SessionQuestion;
  selectedOptionId: string | null;
  isShowingFeedback: boolean;
  optionsLocked?: boolean;
  onSelectOption: (id: string) => void;
};

export function SessionQuestionOptions({
  sessionId,
  q,
  selectedOptionId,
  isShowingFeedback,
  optionsLocked = false,
  onSelectOption,
}: SessionQuestionOptionsProps) {
  const t = useTranslations("session");
  const [expandedMuted, setExpandedMuted] = useState<Record<string, boolean>>(
    {},
  );
  const displayOptions = useSessionOptionOrder(sessionId, q.id, q.options, {
    disableOptionShuffle: q.disableOptionShuffle,
    explanation: q.explanation,
  });

  useEffect(() => {
    setExpandedMuted({});
  }, [q.id]);

  return (
    <motion.div
      variants={optionsContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3 overflow-visible"
      role="radiogroup"
      aria-label={t("answerOptionsAria")}
    >
      {displayOptions.map((opt, i) => {
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
        const isAnimating = showPulse || showShake;
        const isMutedWrong = isShowingFeedback && state === "muted";
        const expanded = expandedMuted[opt.id] === true;
        const collapsed = isMutedWrong && !expanded;
        const statusLabel =
          state === "correct"
            ? t("optionStatusCorrect")
            : state === "wrong"
              ? t("optionStatusYours")
              : undefined;
        const ariaLabel = [t("optionLetterAria", { letter, text: opt.text }), statusLabel]
          .filter(Boolean)
          .join(" — ");

        return (
          <motion.div key={opt.id} variants={optionVariants} className="overflow-visible">
            <motion.div
              className={isAnimating ? "relative z-10 overflow-visible" : "overflow-visible"}
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
                disabled={optionsLocked || isShowingFeedback}
                collapsed={collapsed}
                expanded={isMutedWrong ? expanded : undefined}
                statusLabel={statusLabel}
                ariaLabel={ariaLabel}
                checked={selectedOptionId === opt.id}
                onSelect={() => {
                  if (isMutedWrong) {
                    setExpandedMuted((prev) => ({
                      ...prev,
                      [opt.id]: !prev[opt.id],
                    }));
                    return;
                  }
                  onSelectOption(opt.id);
                }}
              />
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
