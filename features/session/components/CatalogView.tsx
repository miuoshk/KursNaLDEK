"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FormattedExplanation } from "@/features/shared/components/FormattedExplanation";
import type { SessionQuestion } from "@/features/session/types";
import { cn } from "@/lib/utils";

type CatalogViewProps = {
  subjectName: string;
  questions: SessionQuestion[];
};

export function CatalogView({ subjectName, questions }: CatalogViewProps) {
  const [index, setIndex] = useState(0);
  const q = questions[index];

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setIndex((i) => Math.min(questions.length - 1, i + 1)),
    [questions.length],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  if (!q) return null;

  const correctOption = q.options.find((o) => o.id === q.correctOptionId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-3">
        <p className="font-heading text-heading-sm text-primary">
          Katalog pytań — {subjectName}
        </p>
        <p className="font-mono text-body-xs text-secondary">
          {index + 1} / {questions.length}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
          <p className="font-mono text-body-xs text-muted">{q.topicName}</p>
          <p className="mt-4 font-body text-body-md leading-relaxed text-primary md:text-body-lg">
            {q.text}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isCorrect = opt.id === q.correctOptionId;
              return (
                <div
                  key={opt.id}
                  className={cn(
                    "rounded-btn border px-4 py-3 font-body text-body-sm",
                    isCorrect
                      ? "border-success/30 bg-success/[0.08] text-success"
                      : "border-border bg-card text-secondary",
                  )}
                >
                  <span className="mr-2 font-mono font-semibold">{letter}.</span>
                  {opt.text}
                </div>
              );
            })}
          </div>
          {correctOption && (
            <p className="mt-4 font-body text-body-sm text-success">
              Poprawna odpowiedź: {correctOption.text}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-border bg-card p-6 lg:border-l lg:border-t-0 lg:p-8">
          <h3 className="font-heading text-heading-sm text-primary">Wyjaśnienie</h3>
          <div className="mt-3">
            <FormattedExplanation text={q.explanation} />
          </div>
        </div>
      </div>

      <CatalogQuestionNav
        questions={questions}
        currentIndex={index}
        onSelect={setIndex}
      />

      <div className="flex shrink-0 items-center justify-between border-t border-border bg-background px-4 py-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="inline-flex items-center gap-1 rounded-btn px-4 py-2 font-body text-body-sm text-secondary transition-colors hover:text-primary disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Poprzednie
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={index >= questions.length - 1}
          className="inline-flex items-center gap-1 rounded-btn bg-brand-sage px-4 py-2 font-body text-body-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-30"
        >
          Następne
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function CatalogQuestionNav({
  questions,
  currentIndex,
  onSelect,
}: {
  questions: SessionQuestion[];
  currentIndex: number;
  onSelect: (i: number) => void;
}) {
  if (questions.length <= 1) return null;

  return (
    <div className="flex shrink-0 flex-wrap gap-1 border-t border-border bg-background px-4 py-2">
      {questions.map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            "flex size-8 items-center justify-center rounded-btn font-mono text-body-xs transition-colors",
            i === currentIndex
              ? "bg-brand-gold text-brand-bg font-semibold"
              : "bg-card text-secondary hover:text-primary",
          )}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
