"use client";

import type { ReactNode } from "react";
import type { SessionQuestion } from "@/features/session/types";

type QuestionCardProps = {
  question: SessionQuestion;
  children: ReactNode;
  /** Nazwa działu nad pytaniem (Ustawienia → Tematy w sesji). */
  showTopicName?: boolean;
};

export function QuestionCard({
  question,
  children,
  showTopicName = true,
}: QuestionCardProps) {
  const topicLabel =
    showTopicName && question.topicName && question.topicName !== "Temat"
      ? question.topicName
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        {question.sourceCode ? (
          <span className="rounded-pill bg-white/[0.06] px-3 py-1 font-body text-body-xs text-muted">
            {question.sourceCode}
          </span>
        ) : null}
        {topicLabel ? (
          <span className="font-body text-body-xs text-muted">{topicLabel}</span>
        ) : null}
      </div>
      {question.imageUrl ? (
        <div className="relative mt-6 h-64 w-full overflow-hidden rounded-card border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element -- zewnętrzne URL (Supabase Storage) */}
          <img
            src={question.imageUrl}
            alt=""
            className="h-full w-full object-contain"
          />
        </div>
      ) : null}
      <p className="mt-6 whitespace-pre-wrap font-body text-body-md leading-relaxed text-primary md:text-body-lg">
        {question.text}
      </p>
      <div className="mt-6 flex flex-col gap-3">{children}</div>
    </div>
  );
}
