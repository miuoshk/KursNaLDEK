"use client";

import type { SessionAnswer, SessionQuestion } from "@/features/session/types";
import { cn } from "@/lib/utils";

type SessionProgressSquaresProps = {
  questions: SessionQuestion[];
  answeredMap: Record<string, SessionAnswer>;
  currentIndex: number;
  onJumpTo?: (idx: number) => void;
};

export function SessionProgressSquares({
  questions,
  answeredMap,
  currentIndex,
  onJumpTo,
}: SessionProgressSquaresProps) {
  if (questions.length === 0) return null;

  return (
    <div
      className="flex max-w-full gap-1 overflow-x-auto py-0.5"
      role="list"
      aria-label="Postęp w sesji"
    >
      {questions.map((q, idx) => {
        const answer = answeredMap[q.id];
        const isCurrent = idx === currentIndex;
        const isAnswered = answer != null;
        const isCorrect = isAnswered && answer.isCorrect;
        const isWrong = isAnswered && !answer.isCorrect;

        const clickable = typeof onJumpTo === "function";
        const Component = clickable ? "button" : "div";

        let ariaLabel = `Pytanie ${idx + 1}`;
        if (isCorrect) ariaLabel += " — poprawna";
        else if (isWrong) ariaLabel += " — błędna";
        else if (isCurrent) ariaLabel += " — aktualne";
        else ariaLabel += " — nieodpowiedziane";

        return (
          <Component
            key={q.id}
            type={clickable ? "button" : undefined}
            onClick={clickable ? () => onJumpTo!(idx) : undefined}
            aria-label={ariaLabel}
            aria-current={isCurrent ? "true" : undefined}
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-sm border font-body text-[10px] font-medium transition-colors",
              clickable && "cursor-pointer hover:brightness-110",
              isCorrect && "border-success/40 bg-success text-white",
              isWrong && "border-error/40 bg-error text-white",
              !isAnswered &&
                "border-white/15 bg-white/[0.04] text-muted hover:text-secondary",
              isCurrent &&
                "ring-2 ring-brand-gold ring-offset-1 ring-offset-background",
            )}
            role="listitem"
          >
            {idx + 1}
          </Component>
        );
      })}
    </div>
  );
}
