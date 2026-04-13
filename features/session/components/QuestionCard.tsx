"use client";

import type { ReactNode } from "react";
import type { SessionQuestion } from "@/features/session/types";

type QuestionCardProps = {
  question: SessionQuestion;
  children: ReactNode;
};

export function QuestionCard({ question, children }: QuestionCardProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        {question.sourceCode ? (
          <span className="rounded-pill bg-white/[0.06] px-3 py-1 font-body text-body-xs text-muted">
            {question.sourceCode}
          </span>
        ) : null}
        <span className="font-body text-body-xs text-muted">{question.topicName}</span>
      </div>
      <p className="mt-6 font-body text-body-md leading-relaxed text-primary md:text-body-lg">
        {question.text}
      </p>
      <div className="mt-6 flex flex-col gap-3">{children}</div>
    </div>
  );
}
