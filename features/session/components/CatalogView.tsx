"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  List,
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
  const [listOpen, setListOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
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
      if (e.key === "Escape") {
        if (listOpen || explainOpen) {
          e.preventDefault();
          setListOpen(false);
          setExplainOpen(false);
        }
        return;
      }
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
  }, [goPrev, goNext, toggleReveal, listOpen, explainOpen]);

  if (!q) return null;

  const correctOption = q.options.find((o) => o.id === q.correctOptionId);

  function handleSelectFromList(i: number) {
    setIndex(i);
    setListOpen(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border bg-background px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-xl font-bold text-primary md:text-2xl">
              Katalog pytań
            </h1>
            <p className="truncate font-body text-body-xs text-secondary">
              {subjectName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setListOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-btn border border-border bg-card px-3 py-1.5 font-body text-body-xs text-secondary transition-colors hover:border-brand-gold/40 hover:text-primary"
            aria-label="Pokaż listę pytań"
          >
            <List className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Lista</span>
            <span className="font-mono">
              {currentNavPosition >= 0 ? currentNavPosition + 1 : 0}/{navigationIndexes.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setExplainOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-btn border border-border bg-card px-3 py-1.5 font-body text-body-xs text-secondary transition-colors hover:border-brand-gold/40 hover:text-primary lg:hidden"
            aria-label="Pokaż wyjaśnienie"
          >
            <BookOpenText className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Wyjaśnienie</span>
          </button>
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
                      ← → nawigacja · spacja/R odsłoń
                    </p>
                  )}
                </div>
              </article>

              <div className="mt-6">
                <SessionQuestionActions questionId={q.id} questionText={q.text} />
              </div>
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

      <CatalogQuestionListDrawer
        open={listOpen}
        onClose={() => setListOpen(false)}
        questions={questions}
        questionIndexes={navigationIndexes}
        currentIndex={index}
        onSelect={handleSelectFromList}
        searchValue={searchValue}
      />

      <CatalogExplanationDrawer
        open={explainOpen}
        onClose={() => setExplainOpen(false)}
        explanation={q.explanation}
        revealed={isRevealed}
        onToggleReveal={() => {
          toggleReveal();
        }}
      />
    </div>
  );
}

function CatalogQuestionListDrawer({
  open,
  onClose,
  questions,
  questionIndexes,
  currentIndex,
  onSelect,
  searchValue,
}: {
  open: boolean;
  onClose: () => void;
  questions: SessionQuestion[];
  questionIndexes: number[];
  currentIndex: number;
  onSelect: (i: number) => void;
  searchValue: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Zamknij listę pytań"
        onClick={onClose}
        className="flex-1 bg-black/60"
      />
      <div className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl sm:w-[420px]">
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-bold text-primary">Lista pytań</h2>
            <p className="font-body text-body-xs text-muted">
              {questionIndexes.length} {searchValue ? "wyników" : "pytań"} · #{currentIndex + 1} aktywne
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-primary"
            aria-label="Zamknij"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>
        <ol className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {questionIndexes.map((qIdx, i) => {
            const item = questions[qIdx];
            if (!item) return null;
            const isActive = qIdx === currentIndex;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(qIdx)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-btn px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-brand-gold/10 text-primary"
                      : "text-secondary hover:bg-white/[0.03] hover:text-primary",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 rounded-pill px-2 py-0.5 font-body text-[10px] font-semibold",
                      isActive
                        ? "bg-brand-gold text-brand-bg"
                        : "bg-background/60 text-muted",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-body text-body-xs uppercase tracking-wider text-muted">
                      {item.topicName}
                    </p>
                    <p className="line-clamp-2 mt-0.5 font-body text-body-sm">
                      {item.text}
                    </p>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function CatalogExplanationDrawer({
  open,
  onClose,
  explanation,
  revealed,
  onToggleReveal,
}: {
  open: boolean;
  onClose: () => void;
  explanation: string;
  revealed: boolean;
  onToggleReveal: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Zamknij wyjaśnienie"
        onClick={onClose}
        className="flex-1 bg-black/60"
      />
      <div className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl sm:w-[420px]">
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-heading text-lg font-bold text-primary">Wyjaśnienie</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-primary"
            aria-label="Zamknij"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {revealed ? (
            markdownBlock(explanation)
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-background/40 p-6 text-center">
              <EyeOff className="size-6 text-muted" aria-hidden />
              <p className="font-body text-body-sm text-muted">
                Wyjaśnienie jest ukryte.
              </p>
              <button
                type="button"
                onClick={onToggleReveal}
                className="mt-1 inline-flex items-center gap-2 rounded-btn bg-brand-gold px-4 py-2 font-body text-body-sm font-medium text-brand-bg transition-colors hover:brightness-110"
              >
                <Eye className="size-4" aria-hidden />
                Pokaż odpowiedź
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
