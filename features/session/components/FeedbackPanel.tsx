"use client";

import { CheckCircle, XCircle } from "lucide-react";
import type { SessionQuestion } from "@/features/session/types";
import { FormattedExplanation } from "@/features/shared/components/FormattedExplanation";
import { cn } from "@/lib/utils";

function letterForOption(q: SessionQuestion, optionId: string) {
  const idx = q.options.findIndex((o) => o.id === optionId);
  if (idx < 0) return "?";
  return String.fromCharCode(65 + idx);
}

type FeedbackPanelProps = {
  question: SessionQuestion;
  selectedOptionId: string;
  isCorrect: boolean;
};

export function FeedbackPanel({
  question,
  selectedOptionId,
  isCorrect,
}: FeedbackPanelProps) {
  const yourLetter = letterForOption(question, selectedOptionId);
  const correctLetter = letterForOption(question, question.correctOptionId);

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
        {isCorrect ? "Poprawna odpowiedź!" : "Niepoprawna odpowiedź"}
      </div>
      <p className="font-body text-body-sm text-secondary">
        Twoja odpowiedź: {yourLetter} · Poprawna: {correctLetter}
      </p>
      <div className="rounded-card bg-card p-5">
        <h3 className="font-heading text-heading-sm text-primary">Wyjaśnienie</h3>
        <div className="mt-3">
          <FormattedExplanation text={question.explanation} />
        </div>
      </div>
    </div>
  );
}
