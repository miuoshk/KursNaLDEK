"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SessionQuestion } from "@/features/session/types";
import { sessionOptionLetter } from "@/features/session/lib/sessionOptionOrder";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";
import { cn } from "@/lib/utils";

type FeedbackPanelProps = {
  sessionId: string;
  question: SessionQuestion;
  selectedOptionId: string;
  isCorrect: boolean;
  hideExplanation?: boolean;
};

export function FeedbackPanel({
  sessionId,
  question,
  selectedOptionId,
  isCorrect,
  hideExplanation = false,
}: FeedbackPanelProps) {
  const t = useTranslations("session");
  const tCommon = useTranslations("common");
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
          <h3 className="font-heading text-heading-sm text-primary">{tCommon("explanation")}</h3>
          <div className="mt-3">
            {markdownBlock(question.explanation)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
