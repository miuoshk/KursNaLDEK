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
        <span className="font-mono text-body-xs text-muted">{question.topicName}</span>
        {question.sourceCode ? (
          <span className="rounded-pill bg-white/[0.06] px-3 py-1 font-mono text-body-xs text-muted">
            {question.sourceCode}
          </span>
        ) : null}
      </div>
      <p className="mt-6 font-body text-body-md leading-relaxed text-white md:text-body-lg">
        {question.text}
      </p>
      <div className="mt-6 flex flex-col gap-3">{children}</div>
    </div>
  );
}
