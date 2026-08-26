"use client";

import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  Lightbulb,
  Repeat2,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { FeedbackVariant } from "@/features/session/lib/adaptiveFeedback";
import { sessionOptionLetter } from "@/features/session/lib/sessionOptionOrder";
import type { SessionQuestion } from "@/features/session/types";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";
import { cn } from "@/lib/utils";

type FeedbackPanelProps = {
  sessionId: string;
  question: SessionQuestion;
  selectedOptionId: string;
  isCorrect: boolean;
  hideExplanation?: boolean;
  variant: FeedbackVariant;
  transferScheduled?: boolean;
};

export function FeedbackPanel({
  sessionId,
  question,
  selectedOptionId,
  isCorrect,
  hideExplanation = false,
  variant,
  transferScheduled = false,
}: FeedbackPanelProps) {
  const t = useTranslations("session");
  const tCommon = useTranslations("common");
  const blocks = question.explanationBlocks;
  const takeaway = blocks?.takeaway?.trim() || question.explanation;
  const correctReason = blocks?.correctReason?.trim() || question.explanation;
  const selectedDistractorReason =
    blocks?.distractors[selectedOptionId]?.trim() || null;
  const orderCtx = {
    disableOptionShuffle: question.disableOptionShuffle,
    explanation: question.explanation,
  };
  const yourLetter = sessionOptionLetter(
    sessionId,
    question.id,
    question.options,
    selectedOptionId,
    orderCtx,
  );
  const correctLetter = sessionOptionLetter(
    sessionId,
    question.id,
    question.options,
    question.correctOptionId,
    orderCtx,
  );
  const answerLine = t("summaryYourAnswer", {
    selected: yourLetter,
    correct: correctLetter,
    topic: "",
  }).replace(/\s·\s*$/, "");

  return (
    <div className="mx-auto mt-8 w-full max-w-3xl space-y-4">
      <div
        className={cn(
          "flex items-center gap-2 font-body text-body-lg font-semibold",
          isCorrect ? "text-success" : "text-error",
        )}
      >
        {isCorrect ? (
          <CheckCircle className="size-6 shrink-0" aria-hidden />
        ) : (
          <XCircle className="size-6 shrink-0" aria-hidden />
        )}
        {isCorrect ? t("correctAnswer") : t("incorrectAnswer")}
      </div>
      <p className="font-body text-body-sm text-secondary">{answerLine}</p>

      {!hideExplanation ? (
        <div className="rounded-card bg-card p-5">
          <div className="flex gap-3">
            {variant === "concise" ? (
              <Lightbulb
                className="mt-0.5 size-5 shrink-0 text-gold"
                aria-hidden
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-heading-sm text-primary">
                {variant === "concise"
                  ? t("feedbackRemember")
                  : tCommon("explanation")}
              </h3>
              <div className="mt-3">
                {markdownBlock(
                  variant === "concise" ? takeaway : correctReason,
                )}
              </div>
            </div>
          </div>

          {variant === "concise" && blocks?.correctReason ? (
            <details className="group mt-4 border-t border-border pt-3">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-body text-body-sm font-semibold text-sage">
                <ChevronDown
                  className="size-4 transition-transform group-open:rotate-180"
                  aria-hidden
                />
                {t("feedbackFullExplanation")}
              </summary>
              <div className="mt-3">{markdownBlock(blocks.correctReason)}</div>
            </details>
          ) : null}

          {variant === "remedial" && selectedDistractorReason ? (
            <div className="mt-4 rounded-xl border border-error/20 bg-error/5 p-4">
              <p className="font-body text-caption font-bold uppercase tracking-wide text-error">
                {t("feedbackWhySelected")}
              </p>
              <div className="mt-2">
                {markdownBlock(selectedDistractorReason)}
              </div>
            </div>
          ) : null}

          {variant === "remedial" && question.knowledgeCard ? (
            <div className="mt-4 flex gap-3 rounded-xl border border-gold/25 bg-gold/5 p-4">
              <BookOpen
                className="mt-0.5 size-5 shrink-0 text-gold"
                aria-hidden
              />
              <div>
                <p className="font-body text-caption font-bold uppercase tracking-wide text-gold">
                  {t("feedbackRemediation")}
                </p>
                <div className="mt-2">
                  {markdownBlock(question.knowledgeCard)}
                </div>
              </div>
            </div>
          ) : null}

          {variant === "remedial" && transferScheduled ? (
            <p className="mt-4 flex items-center gap-2 font-body text-body-sm font-medium text-sage">
              <Repeat2 className="size-4 shrink-0" aria-hidden />
              {t("feedbackTransferScheduled")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
