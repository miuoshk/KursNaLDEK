"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useHorizontalCarousel } from "@/features/session/hooks/useHorizontalCarousel";
import type { SessionAnswer, SessionQuestion } from "@/features/session/types";
import { scrollChildIntoCenter } from "@/features/session/lib/scrollChildIntoCenter";
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
  const t = useTranslations("session");
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const { ref: scrollRef, overflows, fade } = useHorizontalCarousel(
    questions.length,
  );

  useEffect(() => {
    itemRefs.current.length = questions.length;
  }, [questions.length]);

  useEffect(() => {
    if (!overflows) return;
    const scroller = scrollRef.current;
    const node = itemRefs.current[currentIndex];
    if (!scroller || !node) return;
    scrollChildIntoCenter(scroller, node);
  }, [currentIndex, overflows, scrollRef]);

  if (questions.length === 0) return null;

  return (
    <div className="relative min-w-0">
      <div
        ref={scrollRef}
        className={cn(
          "flex max-w-full flex-nowrap gap-1 px-1 py-1",
          overflows
            ? "overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            : "justify-center overflow-x-auto overflow-y-hidden",
        )}
        data-horizontal-scroll={overflows ? "true" : undefined}
        role="list"
        aria-label={t("sessionProgressAria")}
      >
        {questions.map((q, idx) => {
          const answer = answeredMap[q.id];
          const isCurrent = idx === currentIndex;
          const isAnswered = answer != null;
          const isCorrect = isAnswered && answer.isCorrect;
          const isWrong = isAnswered && !answer.isCorrect;

          const clickable = typeof onJumpTo === "function";
          const Component = clickable ? "button" : "div";

          let ariaLabel = t("catalogQuestionAria", { number: idx + 1 });
          if (isCorrect) ariaLabel += t("progressSquareCorrect");
          else if (isWrong) ariaLabel += t("progressSquareWrong");
          else ariaLabel += t("progressSquareUnanswered");

          return (
            <Component
              key={q.id}
              ref={(el: HTMLButtonElement | HTMLDivElement | null) => {
                itemRefs.current[idx] = el;
              }}
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
      {fade.left ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-7 bg-gradient-to-r from-background to-transparent"
        />
      ) : null}
      {fade.right ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-7 bg-gradient-to-l from-background to-transparent"
        />
      ) : null}
    </div>
  );
}
