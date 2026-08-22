"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  BookOpenText,
  Check,
  ChevronLeft,
  GraduationCap,
  Search,
  Sparkles,
  RotateCcw,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";
import { SessionQuestionActions } from "@/features/shared/components/QuestionFooterActions";
import { QuestionTextContent } from "@/features/shared/components/QuestionTextContent";
import { RichTextContent } from "@/features/shared/components/RichTextContent";
import { QuestionSourceBadge } from "@/features/shared/components/QuestionSourceBadge";
import { isExplanationHiddenForSubject } from "@/lib/content/subjectExplanationPolicy";
import { useSessionOptionOrder } from "@/features/session/hooks/useSessionOptionOrder";
import { useTouchEdgeNavigation } from "@/features/session/hooks/useTouchEdgeNavigation";
import { scrollChildIntoCenter } from "@/features/session/lib/scrollChildIntoCenter";
import type { SessionQuestion } from "@/features/session/types";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/featureFlags";
import { hasCemExams, isSourceFilterLive } from "@/lib/products";
import { SourceFilterBar } from "@/features/shared/components/SourceFilter";
import {
  parseSourceFilterOrAll,
  questionMatchesSource,
  sourceCountsFromTotals,
  type SourceFilter,
} from "@/features/session/lib/sourceFilter";

type CatalogMode = "nauka" | "egzamin";
const MODE_STORAGE_KEY = "catalog-mode";

type CatalogViewProps = {
  sessionId: string;
  subjectId: string;
  subjectName: string;
  questions: SessionQuestion[];
  /**
   * Opcjonalny ID pytania do otwarcia od razu (np. deep-link z zakładki "Zapisane").
   */
  initialQuestionId?: string;
  product?: string | null;
  initialSource?: SourceFilter;
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
  sessionId,
  subjectId,
  subjectName,
  questions,
  initialQuestionId,
  product,
  initialSource = "all",
}: CatalogViewProps) {
  const t = useTranslations("session");
  const hideExplanation = isExplanationHiddenForSubject(subjectId);
  const initialIndex = useMemo(() => {
    if (!initialQuestionId) return 0;
    const i = questions.findIndex((q) => q.id === initialQuestionId);
    return i >= 0 ? i : 0;
  }, [initialQuestionId, questions]);

  const [index, setIndex] = useState(() => initialIndex);
  const [searchValue, setSearchValue] = useState("");
  const [catalogSource, setCatalogSource] = useState(() =>
    parseSourceFilterOrAll(initialSource),
  );
  const [cemSession, setCemSession] = useState<string>("all");
  const [repeatsOnly, setRepeatsOnly] = useState(false);

  const sourceUi =
    Boolean(product) &&
    FEATURES.cemSource &&
    isSourceFilterLive(product);
  const examsUi = sourceUi && hasCemExams(product);

  useEffect(() => {
    if (!initialQuestionId) return;
    const i = questions.findIndex((q) => q.id === initialQuestionId);
    if (i >= 0) setIndex(i);
  }, [initialQuestionId, questions]);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);
  const [mode, setMode] = useState<CatalogMode>("egzamin");
  const [selectedByQ, setSelectedByQ] = useState<Record<string, string>>({});

  // Tryb zapamiętujemy w localStorage — uczy się tak samo na każdym
  // przedmiocie i przy następnym wejściu user dostaje swój wybór.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === "nauka" || stored === "egzamin") {
      setMode(stored);
    }
  }, []);

  const updateMode = useCallback((next: CatalogMode) => {
    setMode(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MODE_STORAGE_KEY, next);
    }
  }, []);

  const sourceCounts = useMemo(() => {
    if (!sourceUi) return null;
    let all = 0;
    let reference = 0;
    let own = 0;
    for (const question of questions) {
      all += 1;
      if (question.source === "own") own += 1;
      else if (question.source === "cem" || question.source === "uczelnia") {
        reference += 1;
      }
    }
    return sourceCountsFromTotals(all, reference);
  }, [questions, sourceUi]);

  const cemSessions = useMemo(() => {
    if (!examsUi) return [] as Array<{ id: string; label: string }>;
    const map = new Map<string, string>();
    for (const question of questions) {
      if (!question.firstSeenSession) continue;
      map.set(
        question.firstSeenSession,
        question.cemSessionLabel?.trim() || question.firstSeenSession,
      );
    }
    return [...map.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pl"));
  }, [examsUi, questions]);

  const normalizedSearch = normalizeSearchText(searchValue);

  const filteredIndexes = useMemo(() => {
    return questions
      .map((question, questionIndex) => {
        if (
          sourceUi &&
          product &&
          !questionMatchesSource(question.source, catalogSource, product)
        ) {
          return -1;
        }
        if (examsUi && cemSession !== "all" && question.firstSeenSession !== cemSession) {
          return -1;
        }
        if (examsUi && repeatsOnly && !((question.repeatCount ?? 0) > 1)) {
          return -1;
        }
        if (!normalizedSearch) return questionIndex;
        const searchable = normalizeSearchText(
          `${question.text} ${question.options.map((opt) => opt.text).join(" ")}`,
        );
        return searchable.includes(normalizedSearch) ? questionIndex : -1;
      })
      .filter((questionIndex) => questionIndex >= 0);
  }, [
    catalogSource,
    cemSession,
    examsUi,
    normalizedSearch,
    product,
    questions,
    repeatsOnly,
    sourceUi,
  ]);

  const navigationIndexes = filteredIndexes;
  const activeIndex = navigationIndexes.includes(index)
    ? index
    : (navigationIndexes[0] ?? 0);
  const currentNavPosition = navigationIndexes.indexOf(activeIndex);
  const q = questions[activeIndex];
  const displayOptions = useSessionOptionOrder(
    sessionId,
    q?.id ?? "",
    q?.options ?? [],
    {
      disableOptionShuffle: q?.disableOptionShuffle,
      explanation: q?.explanation,
    },
  );
  const selectedOptionId = q ? selectedByQ[q.id] : undefined;
  const isRevealed = mode === "nauka" || Boolean(selectedOptionId);

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

  const canGoPrev = currentNavPosition > 0;
  const canGoNext =
    navigationIndexes.length > 0 &&
    currentNavPosition < navigationIndexes.length - 1;

  useTouchEdgeNavigation({
    onPrevious: goPrev,
    onNext: goNext,
    canPrevious: canGoPrev,
    canNext: canGoNext,
  });

  const selectOption = useCallback(
    (optionId: string) => {
      if (!q || mode !== "egzamin") return;
      setSelectedByQ((prev) => {
        if (prev[q.id] === optionId) return prev;
        return { ...prev, [q.id]: optionId };
      });
    },
    [q, mode],
  );

  const resetSelection = useCallback(() => {
    if (!q) return;
    setSelectedByQ((prev) => {
      if (prev[q.id] == null) return prev;
      const next = { ...prev };
      delete next[q.id];
      return next;
    });
  }, [q]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
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
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  if (!q) return null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-background px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href={`/przedmioty/${subjectId}`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-btn text-secondary transition-colors hover:bg-white/[0.06] hover:text-primary"
            aria-label={t("backToSubject")}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-xl font-bold text-primary md:text-2xl">
              {t("modeCatalog")}
            </h1>
            <p className="truncate font-body text-body-xs text-secondary">
              {subjectName}
            </p>
          </div>
          <ModePills value={mode} onChange={updateMode} />
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
            placeholder={t("catalogSearchPlaceholder")}
            className="h-10 w-full rounded-btn border border-border bg-card pl-10 pr-10 font-body text-body-sm text-primary outline-none placeholder:text-muted focus:border-brand-sage/40"
            aria-label={t("catalogSearchAria")}
          />
          {searchValue ? (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-primary"
              aria-label={t("catalogClearSearchAria")}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </label>
        {sourceUi && product && sourceCounts ? (
          <div className="mt-3 space-y-2">
            <SourceFilterBar
              product={product}
              value={catalogSource}
              onChange={setCatalogSource}
              counts={sourceCounts}
            />
            {examsUi ? (
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-w-[180px] flex-1 items-center gap-2 font-body text-body-xs text-secondary">
                  <span className="shrink-0">{t("catalogCemSession")}</span>
                  <select
                    className="h-8 flex-1 rounded-btn border border-border bg-card px-2 text-primary"
                    value={cemSession}
                    onChange={(e) => setCemSession(e.target.value)}
                  >
                    <option value="all">{t("catalogCemSessionAll")}</option>
                    {cemSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 font-body text-body-xs text-secondary">
                  <input
                    type="checkbox"
                    checked={repeatsOnly}
                    onChange={(e) => setRepeatsOnly(e.target.checked)}
                  />
                  {t("catalogRepeatsOnly")}
                </label>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-4 touch-pan-y sm:p-6 lg:p-8">
          {navigationIndexes.length === 0 ? (
            <div className="mx-auto max-w-3xl rounded-card border border-border bg-card p-6 text-center">
              <p className="font-heading text-xl font-bold text-primary">{t("catalogNoResults")}</p>
              <p className="mt-2 font-body text-body-sm text-secondary">
                {t("catalogNoResultsHint")}
              </p>
            </div>
          ) : (
            <div className="mx-auto min-w-0 max-w-3xl">
              <article className="min-w-0 overflow-x-hidden rounded-card border border-border bg-card p-5 sm:p-6">
                <p className="font-body text-body-xs uppercase tracking-widest text-muted">
                  {q.topicName}
                </p>
                {sourceUi ? (
                  <QuestionSourceBadge
                    question={q}
                    product={product}
                    className="mt-2"
                  />
                ) : null}
                {q.imageUrl ? (
                  <div className="relative mt-4 h-56 w-full overflow-hidden rounded-card border border-border bg-background/50 sm:h-64">
                    {/* eslint-disable-next-line @next/next/no-img-element -- zewnętrzne URL (Supabase Storage) */}
                    <img
                      src={q.imageUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : null}
                <QuestionTextContent
                  text={q.text}
                  className="mt-3 text-body-md md:text-body-lg"
                  renderSegment={(segment) => highlightText(segment, searchValue)}
                />

                <div className="mt-6 flex flex-col gap-2">
                  {displayOptions.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isCorrect = opt.id === q.correctOptionId;
                    const isSelected = selectedOptionId === opt.id;
                    const showAsCorrect = isRevealed && isCorrect;
                    const showAsWrong =
                      mode === "egzamin" && isSelected && !isCorrect;
                    const interactive =
                      mode === "egzamin" && !selectedOptionId;

                    const commonClass = cn(
                      "flex w-full items-start gap-3 rounded-btn border px-4 py-3 text-left font-body text-body-sm transition-colors duration-200",
                      showAsCorrect
                        ? "border-success/30 bg-success/[0.08] text-success"
                        : showAsWrong
                          ? "border-error/40 bg-error/[0.08] text-error"
                          : "border-border bg-background/50 text-secondary",
                      interactive &&
                        "cursor-pointer hover:border-brand-gold/40 hover:text-primary",
                    );

                    const badgeClass = cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-body-xs font-semibold",
                      showAsCorrect
                        ? "border-success/30 bg-success/10 text-success"
                        : showAsWrong
                          ? "border-error/40 bg-error/10 text-error"
                          : "border-border bg-background/70 text-muted",
                    );

                    const content = (
                      <>
                        <span className={badgeClass}>{letter}</span>
                        <span className="min-w-0 flex-1">
                          <RichTextContent
                            text={opt.text}
                            renderTextSegment={(segment) => highlightText(segment, searchValue)}
                          />
                        </span>
                        {showAsCorrect ? (
                          <Check
                            className="size-4 shrink-0 text-success"
                            aria-hidden
                          />
                        ) : showAsWrong ? (
                          <X
                            className="size-4 shrink-0 text-error"
                            aria-hidden
                          />
                        ) : null}
                      </>
                    );

                    if (interactive) {
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => selectOption(opt.id)}
                          className={commonClass}
                        >
                          {content}
                        </button>
                      );
                    }

                    return (
                      <div key={opt.id} className={commonClass}>
                        {content}
                      </div>
                    );
                  })}
                </div>

                {mode === "egzamin" && selectedOptionId ? (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={resetSelection}
                      className="inline-flex items-center gap-2 rounded-btn border border-border bg-card px-3 py-1.5 font-body text-body-xs text-secondary transition-colors hover:border-brand-gold/40 hover:text-primary"
                    >
                      <RotateCcw className="size-3.5" aria-hidden />
                      {t("catalogResetAnswer")}
                    </button>
                  </div>
                ) : null}
              </article>

              {!hideExplanation ? (
                <CatalogExplanationPanel
                  className="mt-6 lg:hidden"
                  explanation={q.explanation}
                  revealed={isRevealed}
                />
              ) : null}

              <div className="mt-6">
                <SessionQuestionActions
                  questionId={q.id}
                  questionText={q.text}
                  subjectId={subjectId}
                />
              </div>
            </div>
          )}
        </div>

        {!hideExplanation ? (
          <aside className="hidden min-h-0 w-full max-w-md shrink-0 overflow-y-auto border-l border-border bg-card p-6 lg:block xl:p-8">
            <CatalogExplanationPanel
              explanation={q.explanation}
              revealed={isRevealed}
            />
          </aside>
        ) : null}
      </div>

      <CatalogBottomNav
        questions={questions}
        questionIndexes={navigationIndexes}
        currentIndex={activeIndex}
        onSelect={setIndex}
        selectedByQ={selectedByQ}
        mode={mode}
      />

    </div>
  );
}

function ModePills({
  value,
  onChange,
}: {
  value: CatalogMode;
  onChange: (next: CatalogMode) => void;
}) {
  const t = useTranslations("session");

  return (
    <div className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-border bg-card-hover/40 p-1">
      <ModeButton
        active={value === "nauka"}
        onClick={() => onChange("nauka")}
        icon={<BookOpenText className="size-3.5" aria-hidden />}
        label={t("catalogModeStudy")}
        title={t("catalogModeStudyTitle")}
      />
      <ModeButton
        active={value === "egzamin"}
        onClick={() => onChange("egzamin")}
        icon={<GraduationCap className="size-3.5" aria-hidden />}
        label={t("catalogModeExam")}
        title={t("catalogModeExamTitle")}
      />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-body text-[11px] font-medium transition-colors",
        active
          ? "bg-brand-gold/15 text-brand-gold"
          : "text-secondary hover:text-primary",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function CatalogBottomNav({
  questions,
  questionIndexes,
  currentIndex,
  onSelect,
  selectedByQ,
  mode,
}: {
  questions: SessionQuestion[];
  questionIndexes: number[];
  currentIndex: number;
  onSelect: (i: number) => void;
  selectedByQ: Record<string, string>;
  mode: CatalogMode;
}) {
  const t = useTranslations("session");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = activeRef.current;
    if (!scroller || !active) return;
    scrollChildIntoCenter(scroller, active);
  }, [currentIndex]);

  if (questionIndexes.length <= 1) return null;

  return (
    <div className="min-w-0 shrink-0 border-t border-border bg-card/40 pb-[max(0px,env(safe-area-inset-bottom))]">
      <div
        ref={scrollerRef}
        data-horizontal-scroll
        className="flex w-full min-w-0 max-w-full flex-nowrap gap-1.5 overflow-x-scroll overflow-y-hidden overscroll-x-contain px-3 py-2.5 touch-pan-x [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
      >
        {questionIndexes.map((qIdx, i) => {
          const item = questions[qIdx];
          if (!item) return null;
          const isActive = qIdx === currentIndex;
          const chosen = selectedByQ[item.id];
          const isAnswered = chosen != null && mode === "egzamin";
          const isCorrect =
            isAnswered && chosen === item.correctOptionId;
          const isWrong = isAnswered && !isCorrect;
          return (
            <button
              key={item.id}
              ref={isActive ? activeRef : null}
              type="button"
              onClick={() => onSelect(qIdx)}
              aria-label={t("catalogQuestionAria", { number: i + 1 })}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-btn border font-body text-body-xs transition-colors",
                isActive
                  ? "border-brand-gold bg-brand-gold text-brand-bg font-semibold shadow-[0_0_0_2px_rgba(201,168,76,0.18)]"
                  : isCorrect
                    ? "border-success/40 bg-success/10 text-success hover:brightness-110"
                    : isWrong
                      ? "border-error/40 bg-error/10 text-error hover:brightness-110"
                      : "border-border bg-card text-secondary hover:border-brand-gold/40 hover:text-primary",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CatalogExplanationPanel({
  explanation,
  revealed,
  className,
}: {
  explanation: string;
  revealed: boolean;
  className?: string;
}) {
  const t = useTranslations("session");

  return (
    <section className={className}>
      <h3 className="font-heading text-xl font-bold text-primary">{t("catalogExplanation")}</h3>
      {revealed ? (
        <div className="mt-3 rounded-card border border-border bg-card p-4 sm:p-5">
          {markdownBlock(explanation)}
        </div>
      ) : (
        <div className="mt-3 flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-background/40 p-6 text-center">
          <Sparkles className="size-6 text-muted" aria-hidden />
          <p className="font-body text-body-sm text-muted">
            {t("catalogExplanationHidden")}
          </p>
        </div>
      )}
    </section>
  );
}
