"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";
import type { SessionQuestion } from "@/features/session/types";
import { cn } from "@/lib/utils";

type CatalogViewProps = {
  subjectName: string;
  questions: SessionQuestion[];
};

function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase("pl-PL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeChar(value: string): string {
  return value
    .toLocaleLowerCase("pl-PL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildNormalizedWithMap(value: string): { normalized: string; map: number[] } {
  let normalized = "";
  const map: number[] = [];
  for (let i = 0; i < value.length; i += 1) {
    const folded = normalizeChar(value[i]);
    for (let j = 0; j < folded.length; j += 1) {
      normalized += folded[j];
      map.push(i);
    }
  }
  return { normalized, map };
}

function highlightText(value: string, query: string): ReactNode {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return value;

  const { normalized, map } = buildNormalizedWithMap(value);
  const ranges: Array<{ start: number; end: number }> = [];
  let startAt = 0;

  while (startAt < normalized.length) {
    const hitStart = normalized.indexOf(normalizedQuery, startAt);
    if (hitStart < 0) break;
    const hitEnd = hitStart + normalizedQuery.length;
    const sourceStart = map[hitStart];
    const sourceEnd = (map[hitEnd - 1] ?? sourceStart) + 1;
    const lastRange = ranges[ranges.length - 1];
    if (lastRange && sourceStart <= lastRange.end) {
      lastRange.end = Math.max(lastRange.end, sourceEnd);
    } else {
      ranges.push({ start: sourceStart, end: sourceEnd });
    }
    startAt = hitStart + 1;
  }

  if (ranges.length === 0) return value;

  const parts: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((range, idx) => {
    if (range.start > cursor) {
      parts.push(<span key={`plain-${idx}-${cursor}`}>{value.slice(cursor, range.start)}</span>);
    }
    parts.push(
      <mark
        key={`mark-${idx}-${range.start}`}
        className="rounded-sm bg-brand-gold/25 px-0.5 text-primary"
      >
        {value.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });
  if (cursor < value.length) {
    parts.push(<span key={`tail-${cursor}`}>{value.slice(cursor)}</span>);
  }
  return <>{parts}</>;
}

export function CatalogView({ subjectName, questions }: CatalogViewProps) {
  const [index, setIndex] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const normalizedSearch = normalizeSearchText(searchValue);

  const filteredIndexes = useMemo(() => {
    if (!normalizedSearch) {
      return questions.map((_, questionIndex) => questionIndex);
    }
    return questions
      .map((question, questionIndex) => {
        const searchable = normalizeSearchText(
          `${question.text} ${question.options.map((opt) => opt.text).join(" ")}`,
        );
        return searchable.includes(normalizedSearch) ? questionIndex : -1;
      })
      .filter((questionIndex) => questionIndex >= 0);
  }, [normalizedSearch, questions]);

  const navigationIndexes = filteredIndexes;
  const activeIndex = navigationIndexes.includes(index) ? index : (navigationIndexes[0] ?? 0);
  const currentNavPosition = navigationIndexes.indexOf(activeIndex);
  const q = questions[activeIndex];

  const goPrev = useCallback(() => {
    if (navigationIndexes.length === 0) return;
    const safePosition = currentNavPosition >= 0 ? currentNavPosition : 0;
    const prevPosition = Math.max(0, safePosition - 1);
    setIndex(navigationIndexes[prevPosition] ?? 0);
  }, [currentNavPosition, navigationIndexes]);
  const goNext = useCallback(() => {
    if (navigationIndexes.length === 0) return;
    const safePosition = currentNavPosition >= 0 ? currentNavPosition : 0;
    const nextPosition = Math.min(navigationIndexes.length - 1, safePosition + 1);
    setIndex(navigationIndexes[nextPosition] ?? 0);
  }, [currentNavPosition, navigationIndexes]);

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
      <div className="shrink-0 border-b border-border bg-background px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-heading text-heading-sm text-primary">Katalog pytań</p>
            <p className="line-clamp-2 font-body text-body-xs text-muted sm:line-clamp-1">
              {subjectName}
            </p>
          </div>
          <p className="shrink-0 rounded-pill border border-border bg-card px-2.5 py-1 font-body text-body-xs text-secondary">
            {currentNavPosition >= 0 ? currentNavPosition + 1 : 0} / {navigationIndexes.length}
          </p>
        </div>
      </div>

      <div className="shrink-0 border-b border-border bg-background px-4 py-3">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Szukaj w pytaniach i odpowiedziach..."
            className="h-10 w-full rounded-btn border border-border bg-card pl-10 pr-10 font-body text-body-sm text-primary outline-none placeholder:text-muted focus:border-brand-sage/40"
            aria-label="Szukaj w katalogu pytań"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-primary"
              aria-label="Wyczyść wyszukiwanie"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </label>
        <p className="mt-2 font-body text-body-xs text-muted">
          Wyniki: {navigationIndexes.length} z {questions.length}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {navigationIndexes.length === 0 ? (
            <div className="rounded-card border border-border bg-card p-6 text-center">
              <p className="font-heading text-heading-sm text-primary">Brak wyników</p>
              <p className="mt-2 font-body text-body-sm text-secondary">
                Nie znaleziono frazy w treści pytania ani odpowiedziach.
              </p>
            </div>
          ) : null}
          {navigationIndexes.length === 0 ? null : (
            <>
              <p className="font-body text-body-xs text-muted">{q.topicName}</p>
              <p className="mt-4 font-body text-body-md leading-relaxed text-primary md:text-body-lg">
                {highlightText(q.text, searchValue)}
              </p>
              <div className="mt-6 flex flex-col gap-2">
                {q.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isCorrect = opt.id === q.correctOptionId;
                  return (
                    <div
                      key={opt.id}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-btn border px-4 py-3 text-left font-body text-body-sm",
                        isCorrect
                          ? "border-success/30 bg-success/[0.08] text-success"
                          : "border-border bg-card text-secondary",
                      )}
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background/70 text-body-xs font-semibold text-muted">
                        {letter}
                      </span>
                      <span className="min-w-0 flex-1">{highlightText(opt.text, searchValue)}</span>
                    </div>
                  );
                })}
              </div>
              {correctOption && (
                <p className="mt-4 font-body text-body-sm text-success">
                  Poprawna odpowiedź: {highlightText(correctOption.text, searchValue)}
                </p>
              )}

              <CatalogExplanationMobile explanation={q.explanation} key={q.id} />
            </>
          )}
        </div>

        <div className="hidden min-h-0 flex-1 overflow-y-auto border-l border-border bg-card p-8 lg:block">
          <h3 className="font-heading text-heading-sm text-primary">Wyjaśnienie</h3>
          {navigationIndexes.length === 0 ? (
            <p className="mt-3 font-body text-body-sm text-muted">
              Wybierz inną frazę, aby wyświetlić pytanie i wyjaśnienie.
            </p>
          ) : (
            <div className="mt-3">{markdownBlock(q.explanation)}</div>
          )}
        </div>
      </div>

      <CatalogQuestionNav
        questionIndexes={navigationIndexes}
        currentIndex={index}
        onSelect={setIndex}
      />

      <div className="flex shrink-0 items-center justify-between border-t border-border bg-background px-4 py-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={navigationIndexes.length === 0 || currentNavPosition <= 0}
          className="inline-flex items-center gap-1 rounded-btn px-4 py-2 font-body text-body-sm text-secondary transition-colors hover:text-primary disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Poprzednie
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={
            navigationIndexes.length === 0 ||
            currentNavPosition >= navigationIndexes.length - 1
          }
          className="inline-flex items-center gap-1 rounded-btn bg-brand-sage px-4 py-2 font-body text-body-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-30"
        >
          Następne
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function CatalogExplanationMobile({ explanation }: { explanation: string }) {
  return (
    <div className="mt-4 border-t border-white/10 pt-4 lg:hidden">
      <p className="font-body text-body-sm font-medium text-primary">Wyjaśnienie</p>
      <div className="mt-3">{markdownBlock(explanation)}</div>
    </div>
  );
}

function CatalogQuestionNav({
  questionIndexes,
  currentIndex,
  onSelect,
}: {
  questionIndexes: number[];
  currentIndex: number;
  onSelect: (i: number) => void;
}) {
  if (questionIndexes.length <= 1) return null;

  return (
    <div className="shrink-0 border-t border-border bg-background px-3 py-2 sm:px-4">
      <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
        {questionIndexes.map((questionIndex, i) => (
          <button
            key={questionIndex}
            type="button"
            onClick={() => onSelect(questionIndex)}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-btn font-body text-body-xs transition-colors",
              questionIndex === currentIndex
                ? "bg-brand-gold text-brand-bg font-semibold"
                : "bg-card text-secondary hover:text-primary",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
