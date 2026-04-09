"use client";

import type { ReactNode } from "react";
import type { SessionQuestion } from "@/features/session/types";
import { cn } from "@/lib/utils";

function difficultyStyle(d: string) {
  const x = d.toLowerCase();
  if (x === "latwe" || x === "łatwe")
    return { label: "Łatwe", className: "bg-success/10 text-success" };
  if (x === "trudne") return { label: "Trudne", className: "bg-error/10 text-error" };
  return { label: "Średnie", className: "bg-brand-gold/10 text-brand-gold" };
}

type QuestionCardProps = {
  question: SessionQuestion;
  children: ReactNode;
};

export function QuestionCard({ question, children }: QuestionCardProps) {
  const diff = difficultyStyle(question.difficulty);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-pill px-3 py-1 font-body text-body-xs font-medium",
            diff.className,
          )}
        >
          {diff.label}
        </span>
        {question.sourceCode ? (
          <span className="rounded-pill bg-white/[0.06] px-3 py-1 font-mono text-body-xs text-muted">
            {question.sourceCode}
          </span>
        ) : null}
        <span className="font-mono text-body-xs text-muted">{question.topicName}</span>
      </div>
      <p className="mt-6 font-body text-body-md leading-relaxed text-white md:text-body-lg">
        {question.text}
      </p>
      <div className="mt-6 flex flex-col gap-3">{children}</div>
    </div>
  );
}
