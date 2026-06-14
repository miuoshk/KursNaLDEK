"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [overflows, setOverflows] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setOverflows(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useEffect(() => {
    itemRefs.current.length = questions.length;
    checkOverflow();
  }, [questions.length, checkOverflow]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    return () => ro.disconnect();
  }, [checkOverflow]);

  useEffect(() => {
    if (!overflows) return;
    const node = itemRefs.current[currentIndex];
    node?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [currentIndex, overflows]);

  if (questions.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex max-w-full gap-1 py-0.5",
        overflows
          ? "overflow-x-auto scroll-smooth [scrollbar-width:thin]"
          : "justify-center overflow-hidden",
      )}
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
  );
}
