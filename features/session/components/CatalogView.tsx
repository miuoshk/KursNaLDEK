"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";
import type { SessionQuestion } from "@/features/session/types";
import { cn } from "@/lib/utils";

type CatalogViewProps = {
  subjectName: string;
  questions: SessionQuestion[];
};

type CatalogMode = "nauka" | "egzamin";

export function CatalogView({ subjectName, questions }: CatalogViewProps) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<CatalogMode>("nauka");
  const [selectedOptionByQuestion, setSelectedOptionByQuestion] = useState<
    Record<string, string | undefined>
  >({});
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

  const isStudyMode = mode === "nauka";
  const selectedOptionId = selectedOptionByQuestion[q.id] ?? null;
  const isExamAnswered = selectedOptionId !== null;
  const correctOption = q.options.find((o) => o.id === q.correctOptionId);

  function onSelectExamOption(optionId: string) {
    if (isStudyMode) return;

    setSelectedOptionByQuestion((prev) => {
      const current = prev[q.id] ?? null;
      if (current === optionId) {
        const next = { ...prev };
        delete next[q.id];
        return next;
      }
      return { ...prev, [q.id]: optionId };
    });
  }

  function optionState(optionId: string): "default" | "correct" | "wrong" | "muted" {
    if (isStudyMode) {
      return optionId === q.correctOptionId ? "correct" : "default";
    }

    if (!selectedOptionId) return "default";
    if (optionId === q.correctOptionId) return "correct";
    if (optionId === selectedOptionId) return "wrong";
    return "muted";
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-3">
        <div>
          <p className="font-heading text-heading-sm text-primary">Katalog pytań</p>
          <p className="font-body text-body-xs text-muted">{subjectName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-pill border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setMode("nauka")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-body text-body-xs transition-colors",
                isStudyMode
                  ? "bg-brand-sage text-white"
                  : "text-secondary hover:text-primary",
              )}
            >
              <Eye className="size-3.5" aria-hidden />
              Tryb nauki
            </button>
            <button
              type="button"
              onClick={() => setMode("egzamin")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-body text-body-xs transition-colors",
                !isStudyMode
                  ? "bg-brand-gold text-brand-bg"
                  : "text-secondary hover:text-primary",
              )}
            >
              <EyeOff className="size-3.5" aria-hidden />
              Tryb egzaminacyjny
            </button>
          </div>
          <p className="font-body text-body-xs text-secondary">
            {index + 1} / {questions.length}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
          <p className="font-body text-body-xs text-muted">{q.topicName}</p>
          <p className="mt-4 font-body text-body-md leading-relaxed text-primary md:text-body-lg">
            {q.text}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const state = optionState(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectExamOption(opt.id)}
                  disabled={isStudyMode}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-btn border px-4 py-3 text-left font-body text-body-sm transition-colors",
                    state === "default" &&
                      "border-border bg-card text-secondary hover:border-brand-sage/30",
                    state === "correct" && "border-success/30 bg-success/[0.08] text-success",
                    state === "wrong" && "border-error/35 bg-error/[0.08] text-error",
                    state === "muted" && "border-border bg-card text-muted",
                    isStudyMode && "cursor-default",
                  )}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background/70 text-body-xs font-semibold text-muted">
                    {letter}
                  </span>
                  <span className="min-w-0 flex-1">{opt.text}</span>
                  {!isStudyMode && isExamAnswered && opt.id === q.correctOptionId ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-body-xs font-semibold text-success">
                      <Check className="size-3.5" aria-hidden />
                      POPRAWNA
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {isStudyMode && correctOption && (
            <p className="mt-4 font-body text-body-sm text-success">
              Poprawna odpowiedź: {correctOption.text}
            </p>
          )}
          {!isStudyMode ? (
            <p className="mt-4 font-body text-body-xs text-muted">
              {isExamAnswered
                ? "Kliknij ponownie wybraną odpowiedź, aby ją schować."
                : "Kliknij odpowiedź, aby sprawdzić wynik (bez zapisu do rankingu)."}
            </p>
          ) : null}

          <CatalogExplanationMobile
            explanation={q.explanation}
            questionId={q.id}
            isAlwaysVisible={isStudyMode}
            isLocked={!isStudyMode && !isExamAnswered}
          />
        </div>

        <div className="hidden min-h-0 flex-1 overflow-y-auto border-l border-border bg-card p-8 lg:block">
          <h3 className="font-heading text-heading-sm text-primary">Wyjaśnienie</h3>
          {isStudyMode || isExamAnswered ? (
            <div className="mt-3">{markdownBlock(q.explanation)}</div>
          ) : (
            <p className="mt-3 font-body text-body-sm text-muted">
              Odpowiedz na pytanie, aby odkryć wyjaśnienie.
            </p>
          )}
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

function CatalogExplanationMobile({
  explanation,
  questionId,
  isAlwaysVisible,
  isLocked,
}: {
  explanation: string;
  questionId: string;
  isAlwaysVisible: boolean;
  isLocked: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isAlwaysVisible);
  }, [questionId, isAlwaysVisible]);

  useEffect(() => {
    if (isLocked) setOpen(false);
  }, [isLocked]);

  if (isAlwaysVisible) {
    return (
      <div className="mt-4 border-t border-white/10 pt-4 lg:hidden">
        <p className="font-body text-body-sm font-medium text-primary">Wyjaśnienie</p>
        <div className="mt-3">{markdownBlock(explanation)}</div>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isLocked}
        className="flex w-full items-center justify-between gap-2 font-body text-body-sm font-medium text-primary transition-colors hover:text-brand-gold"
        aria-expanded={open}
      >
        Wyjaśnienie
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-secondary transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {isLocked ? (
        <p className="mt-3 font-body text-body-xs text-muted">
          Odpowiedz na pytanie, aby odkryć wyjaśnienie.
        </p>
      ) : null}
      {open && !isLocked && (
        <div className="mt-3 animate-fade-in">
          {markdownBlock(explanation)}
        </div>
      )}
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
            "flex size-8 items-center justify-center rounded-btn font-body text-body-xs transition-colors",
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
