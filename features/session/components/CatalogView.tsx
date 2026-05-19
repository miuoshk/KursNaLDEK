"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Search,
  X,
} from "lucide-react";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";
import { SessionQuestionActions } from "@/features/shared/components/QuestionFooterActions";
import type { SessionQuestion } from "@/features/session/types";
import { cn } from "@/lib/utils";

type CatalogViewProps = {
  subjectName: string;
  questions: SessionQuestion[];
  /**
   * Opcjonalny ID pytania do otwarcia od razu (np. deep-link z zakładki "Zapisane").
   * Jeśli pytanie istnieje na liście, zostanie odsłonięte automatycznie.
   */
  initialQuestionId?: string;
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

export function CatalogView({
  subjectName,
  questions,
  initialQuestionId,
}: CatalogViewProps) {
  const initialIndex = useMemo(() => {
    if (!initialQuestionId) return 0;
    const i = questions.findIndex((q) => q.id === initialQuestionId);
    return i >= 0 ? i : 0;
  }, [initialQuestionId, questions]);
  const [index, setIndex] = useState(initialIndex);
  const [searchValue, setSearchValue] = useState("");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (initialQuestionId) {
      const found = questions.find((q) => q.id === initialQuestionId);
      if (found) initial.add(found.id);
    }
    return initial;
  });
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
  const isRevealed = q ? revealedIds.has(q.id) : false;

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

  const toggleReveal = useCallback(() => {
    if (!q) return;
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) {
        next.delete(q.id);
      } else {
        next.add(q.id);
      }
      return next;
    });
  }, [q]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === " " || e.key.toLowerCase() === "r") {
        e.preventDefault();
        toggleReveal();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, toggleReveal]);

  if (!q) return null;

  const correctOption = q.options.find((o) => o.id === q.correctOptionId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border bg-background px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-bold text-primary md:text-2xl">
              Katalog pytań
            </h1>
            <p className="line-clamp-2 mt-1 font-body text-body-xs text-secondary sm:line-clamp-1">
              {subjectName} · tryb egzaminacyjny: kliknij <em>Pokaż odpowiedź</em>, aby odsłonić poprawną opcję i wyjaśnienie.
            </p>
          </div>
          <p className="shrink-0 rounded-pill border border-border bg-card px-2.5 py-1 font-body text-body-xs text-secondary">
            {currentNavPosition >= 0 ? currentNavPosition + 1 : 0} / {navigationIndexes.length}
          </p>
        </div>
      </div>

      <div className="shrink-0 border-b border-border bg-background px-4 py-3 sm:px-6">
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
          <span className="ml-2 text-muted/80">
            · skróty: ← → nawigacja, spacja lub R = odsłoń / ukryj
          </span>
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {navigationIndexes.length === 0 ? (
            <div className="mx-auto max-w-3xl rounded-card border border-border bg-card p-6 text-center">
              <p className="font-heading text-xl font-bold text-primary">Brak wyników</p>
              <p className="mt-2 font-body text-body-sm text-secondary">
                Nie znaleziono frazy w treści pytania ani odpowiedziach.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl">
              <article className="rounded-card border border-border bg-card p-5 sm:p-6">
                <p className="font-body text-body-xs uppercase tracking-widest text-muted">
                  {q.topicName}
                </p>
                <p className="mt-3 font-body text-body-md leading-relaxed text-primary md:text-body-lg">
                  {highlightText(q.text, searchValue)}
                </p>

                <div className="mt-6 flex flex-col gap-2">
                  {q.options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isCorrect = opt.id === q.correctOptionId;
                    const showCorrect = isRevealed && isCorrect;
                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-btn border px-4 py-3 text-left font-body text-body-sm transition-colors duration-200",
                          showCorrect
                            ? "border-success/30 bg-success/[0.08] text-success"
                            : "border-border bg-background/50 text-secondary",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full border text-body-xs font-semibold",
                            showCorrect
                              ? "border-success/30 bg-success/10 text-success"
                              : "border-border bg-background/70 text-muted",
                          )}
                        >
                          {letter}
                        </span>
                        <span className="min-w-0 flex-1">
                          {highlightText(opt.text, searchValue)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={toggleReveal}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-btn px-4 py-2 font-body text-body-sm font-medium transition-colors",
                      isRevealed
                        ? "border border-border bg-card text-secondary hover:text-primary"
                        : "bg-brand-gold text-brand-bg hover:brightness-110",
                    )}
                  >
                    {isRevealed ? (
                      <>
                        <EyeOff className="size-4" aria-hidden />
                        Ukryj odpowiedź
                      </>
                    ) : (
                      <>
                        <Eye className="size-4" aria-hidden />
                        Pokaż odpowiedź
                      </>
                    )}
                  </button>
                  {isRevealed && correctOption ? (
                    <p className="font-body text-body-sm text-success">
                      Poprawna: {highlightText(correctOption.text, searchValue)}
                    </p>
                  ) : (
                    <p className="font-body text-body-xs text-muted">
                      Skrót: spacja lub R
                    </p>
                  )}
                </div>
              </article>

              <div className="mt-6">
                <SessionQuestionActions questionId={q.id} questionText={q.text} />
              </div>

              <CatalogExplanationMobile
                explanation={q.explanation}
                revealed={isRevealed}
                key={q.id}
              />
            </div>
          )}
        </div>

        <aside className="hidden min-h-0 w-full max-w-md shrink-0 overflow-y-auto border-l border-border bg-card p-6 lg:block xl:p-8">
          <h3 className="font-heading text-xl font-bold text-primary">Wyjaśnienie</h3>
          {navigationIndexes.length === 0 ? (
            <p className="mt-3 font-body text-body-sm text-muted">
              Wybierz inną frazę, aby wyświetlić pytanie i wyjaśnienie.
            </p>
          ) : isRevealed ? (
            <div className="mt-3">{markdownBlock(q.explanation)}</div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-background/40 p-6 text-center">
              <EyeOff className="size-6 text-muted" aria-hidden />
              <p className="font-body text-body-sm text-muted">
                Wyjaśnienie jest ukryte. Kliknij <em>Pokaż odpowiedź</em>, aby je zobaczyć.
              </p>
            </div>
          )}
        </aside>
      </div>

      <CatalogQuestionNav
        questionIndexes={navigationIndexes}
        currentIndex={index}
        onSelect={setIndex}
      />

      <div className="flex shrink-0 items-center justify-between border-t border-border bg-background px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={goPrev}
          disabled={navigationIndexes.length === 0 || currentNavPosition <= 0}
          className="inline-flex items-center gap-1 rounded-btn px-4 py-2 font-body text-body-sm text-secondary transition-colors hover:text-primary disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Poprzednie
        </button>
        <p className="font-body text-body-xs text-muted">
          {currentNavPosition >= 0 ? currentNavPosition + 1 : 0} / {navigationIndexes.length}
        </p>
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

function CatalogExplanationMobile({
  explanation,
  revealed,
}: {
  explanation: string;
  revealed: boolean;
}) {
  return (
    <div className="mt-6 border-t border-white/10 pt-4 lg:hidden">
      <p className="font-heading text-lg font-bold text-primary">Wyjaśnienie</p>
      {revealed ? (
        <div className="mt-3">{markdownBlock(explanation)}</div>
      ) : (
        <div className="mt-3 flex items-center gap-2 rounded-card border border-dashed border-border bg-background/40 p-4 text-center">
          <EyeOff className="size-4 text-muted" aria-hidden />
          <p className="font-body text-body-xs text-muted">
            Ukryte. Kliknij <em>Pokaż odpowiedź</em>, aby zobaczyć.
          </p>
        </div>
      )}
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
