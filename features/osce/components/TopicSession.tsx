"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown, ClipboardList, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ConversionDrillRoundResult,
  ConversionDrillSummary,
} from "@/features/osce/components/ConversionDrillQuestion";
import { ConversionDrillQuestion } from "@/features/osce/components/ConversionDrillQuestion";
import { ImageIdentifyQuestion } from "@/features/osce/components/ImageIdentifyQuestion";
import type { ImageIdentifyAnswer } from "@/features/osce/components/ImageIdentifyQuestion";
import { KnowledgeOverlay } from "@/features/osce/components/KnowledgeOverlay";
import { OrderingQuestion } from "@/features/osce/components/OrderingQuestion";
import { QuestionCard } from "@/features/osce/components/QuestionCard";
import type { ResultRow } from "@/features/osce/components/TopicSessionSummary";
import { TopicSessionIntro } from "@/features/osce/components/TopicSessionIntro";
import { TopicSessionSummary } from "@/features/osce/components/TopicSessionSummary";
import { createOsceTopicSession } from "@/features/osce/server/createOsceTopicSession";
import { encodeTopicAnswerSelection } from "@/features/osce/lib/encodeTopicAnswer";
import { completeSession } from "@/features/session/api/completeSession";
import { submitAnswer } from "@/features/session/api/submitAnswer";
import { SummaryAnswerStrip } from "@/features/session/components/SummaryAnswerStrip";
import { SummaryHero } from "@/features/session/components/SummaryHero";
import { SummaryTopicBreakdown } from "@/features/session/components/SummaryTopicBreakdown";
import { SummaryXpCard } from "@/features/session/components/SummaryXpCard";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import {
  resolveOsceQuestionKind,
  toOsceConversionItems,
  toOsceImageIdentify,
  toOsceOrdering,
  toOsceSingleChoice,
} from "@/features/osce/lib/topicQuestionMappers";
import type { TopicSessionQuestionRow } from "@/features/osce/types";
import { cn } from "@/lib/utils";

export type ExamTask = { task: number; description: string };

export type TopicSessionProps = {
  initialSessionId: string;
  stationId: string;
  topicId: string;
  topicName: string;
  stationShortName: string;
  knowledgeCard: string | null;
  questions: TopicSessionQuestionRow[];
  nextTopicId: string | null;
  stationHref: string;
  examTasks: ExamTask[] | null;
};

type Phase = "intro" | "questions" | "summary";

function truncateLabel(text: string, max = 96): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TopicSession({
  initialSessionId,
  stationId,
  topicId,
  topicName,
  stationShortName,
  knowledgeCard,
  questions: initialQuestions,
  nextTopicId,
  stationHref,
  examTasks,
}: TopicSessionProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [showKnowledgeOverlay, setShowKnowledgeOverlay] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [queue, setQueue] = useState<TopicSessionQuestionRow[]>(initialQuestions);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [retryMode, setRetryMode] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<SessionSummaryData | null>(null);

  const questionStartRef = useRef<number>(Date.now());
  const completedRef = useRef(false);

  const total = queue.length;
  const current = queue[index] ?? null;
  const kind = current ? resolveOsceQuestionKind(current) : "single_choice";

  const goNextQuestion = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= queue.length) {
        setPhase("summary");
        return i;
      }
      return i + 1;
    });
  }, [queue.length]);

  useEffect(() => {
    if (phase === "questions" && current) {
      questionStartRef.current = Date.now();
    }
  }, [phase, index, current?.id]);

  useEffect(() => {
    if (phase !== "summary" || completedRef.current) return;
    completedRef.current = true;
    void completeSession({ sessionId, durationSecondsFallback: timerSec })
      .then((res) => {
        if (res.ok) setCompletedSummary(res.summary);
      })
      .catch(() => {
        completedRef.current = false;
      });
  }, [phase, sessionId, timerSec]);

  useEffect(() => {
    if (phase !== "questions") return;
    const t = setInterval(() => setTimerSec((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const timeSpentSeconds = useCallback(() => {
    return Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000));
  }, []);

  const pushResult = useCallback((questionId: string, text: string, isCorrect: boolean) => {
    const label = truncateLabel(text);
    setResults((prev) => {
      const next = prev.filter((r) => r.questionId !== questionId);
      return [...next, { questionId, label, isCorrect }];
    });
  }, []);

  const persist = useCallback(
    async (input: {
      questionId: string;
      questionType: string;
      isCorrect: boolean;
      order: number;
      singleChoiceId?: string | null;
      ordering?: string[];
      imageIdentify?: { answers: ImageIdentifyAnswer[]; score: number };
      conversionDrill?: {
        rounds: ConversionDrillRoundResult[];
        correct: number;
        total: number;
      };
    }) => {
      const selectedOptionId = encodeTopicAnswerSelection({
        questionType: input.questionType,
        singleChoiceId: input.singleChoiceId,
        ordering: input.ordering,
        imageIdentify: input.imageIdentify,
        conversionDrill: input.conversionDrill,
      });
      const res = await submitAnswer({
        sessionId,
        questionId: input.questionId,
        selectedOptionId,
        isCorrect: input.isCorrect,
        confidence: input.isCorrect ? "na_pewno" : "nie_wiedzialem",
        timeSpentSeconds: timeSpentSeconds(),
        questionOrder: input.order,
      });
      return res.ok;
    },
    [sessionId, timeSpentSeconds],
  );

  const handleSingleAnswer = useCallback(
    (qid: string, selectedOptionId: string | null, isCorrect: boolean) => {
      const row = queue.find((q) => q.id === qid);
      if (row) {
        void persist({
          questionId: qid,
          questionType: "single_choice",
          isCorrect,
          order: index,
          singleChoiceId: selectedOptionId,
        });
        pushResult(qid, row.text, isCorrect);
      }
    },
    [queue, index, persist, pushResult],
  );

  const handleOrderingAnswer = useCallback(
    (qid: string, _order: string[], isCorrect: boolean) => {
      const row = queue.find((q) => q.id === qid);
      if (row) {
        void persist({
          questionId: qid,
          questionType: "ordering",
          isCorrect,
          order: index,
          ordering: _order,
        });
        pushResult(qid, row.text, isCorrect);
      }
    },
    [queue, index, persist, pushResult],
  );

  const handleImageAnswer = useCallback(
    (qid: string, answers: ImageIdentifyAnswer[], score: number) => {
      const row = queue.find((q) => q.id === qid);
      if (row) {
        const isCorrect = Math.abs(score - 1) < 1e-9;
        void persist({
          questionId: qid,
          questionType: "image_identify",
          isCorrect,
          order: index,
          imageIdentify: { answers, score },
        });
        pushResult(qid, row.text, isCorrect);
      }
    },
    [queue, index, persist, pushResult],
  );

  const handleDrillComplete = useCallback(
    (summary: ConversionDrillSummary) => {
      const row = queue.find((q) => q.id === current?.id);
      if (!row || !current) return;
      const isCorrect = summary.total > 0 && summary.correct === summary.total;
      void persist({
        questionId: current.id,
        questionType: "conversion_drill",
        isCorrect,
        order: index,
        conversionDrill: {
          rounds: summary.rounds,
          correct: summary.correct,
          total: summary.total,
        },
      });
      pushResult(current.id, row.text, isCorrect);
    },
    [queue, current, index, persist, pushResult],
  );

  const wrongOnly = useMemo(() => {
    const wrong = new Set(results.filter((r) => !r.isCorrect).map((r) => r.questionId));
    return queue.filter((q) => wrong.has(q.id));
  }, [queue, results]);

  const handleRetryWrong = useCallback(async () => {
    if (wrongOnly.length === 0) return;
    const created = await createOsceTopicSession({
      subjectId: stationId,
      topicId,
      totalQuestions: wrongOnly.length,
    });
    if (!created.ok) return;
    completedRef.current = false;
    setCompletedSummary(null);
    setSessionId(created.sessionId);
    setQueue(wrongOnly);
    setResults([]);
    setIndex(0);
    setTimerSec(0);
    setRetryMode(true);
    setPhase("questions");
  }, [wrongOnly, stationId, topicId]);

  const nextTopicHref =
    nextTopicId != null ? `/osce/${stationId}/${nextTopicId}` : null;

  const questionBlock = (() => {
    if (!current) {
      return (
        <p className="font-body text-body-md text-muted">Brak pytań w kolejce.</p>
      );
    }

    if (kind === "ordering") {
      const o = toOsceOrdering(current);
      if (!o) {
        return (
          <p className="font-body text-body-md text-error">
            Nie można wyświetlić pytania typu porządkowanie (niepełne dane).
          </p>
        );
      }
      return (
        <OrderingQuestion
          question={o}
          onAnswer={handleOrderingAnswer}
          onNext={goNextQuestion}
        />
      );
    }

    if (kind === "image_identify") {
      const img = toOsceImageIdentify(current);
      if (!img) {
        return (
          <p className="font-body text-body-md text-error">
            Nie można wyświetlić pytania z obrazem (niepełne dane).
          </p>
        );
      }
      return (
        <ImageIdentifyQuestion
          question={img}
          onAnswer={handleImageAnswer}
          onNext={goNextQuestion}
        />
      );
    }

    if (kind === "conversion_drill") {
      const drills = toOsceConversionItems(current);
      if (!drills) {
        return (
          <p className="font-body text-body-md text-error">
            Nie można wyświetlić serii konwersji (niepełne dane).
          </p>
        );
      }
      return (
        <ConversionDrillQuestion
          questions={drills}
          onDrillComplete={handleDrillComplete}
          onContinueAfterDrill={goNextQuestion}
          soundEnabled
        />
      );
    }

    const sc = toOsceSingleChoice(current);
    if (!sc) {
      return (
        <p className="font-body text-body-md text-error">
          Nie można wyświetlić pytania (brak opcji odpowiedzi).
        </p>
      );
    }
    return (
      <QuestionCard
        question={sc}
        onAnswer={handleSingleAnswer}
        onNext={goNextQuestion}
      />
    );
  })();

  const hasExamTasks = examTasks != null && examTasks.length > 0;
  const pct = total > 0 ? Math.min(100, ((index + 1) / total) * 100) : 0;

  if (phase === "intro" && !retryMode) {
    return (
      <>
        <TopicSessionIntro
          knowledgeCard={knowledgeCard}
          onStart={() => {
            setPhase("questions");
            setShowKnowledgeOverlay(false);
          }}
        />
        {showKnowledgeOverlay ? (
          <KnowledgeOverlay
            knowledgeCard={knowledgeCard}
            onClose={() => setShowKnowledgeOverlay(false)}
          />
        ) : null}
      </>
    );
  }

  if (phase === "summary") {
    if (completedSummary) {
      return (
        <div className="mx-auto w-full max-w-4xl space-y-10 pb-12">
          <SummaryHero summary={completedSummary} />
          <SummaryAnswerStrip summary={completedSummary} />
          <SummaryTopicBreakdown summary={completedSummary} />
          <SummaryXpCard summary={completedSummary} />

          {/* OSCE-specific actions */}
          <div className="flex flex-wrap items-center justify-end gap-4">
            {nextTopicHref ? (
              <Link
                href={nextTopicHref}
                className="rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
              >
                Nastepny temat
              </Link>
            ) : null}
            {wrongOnly.length > 0 ? (
              <button
                type="button"
                onClick={() => void handleRetryWrong()}
                className="rounded-btn border border-brand-sage bg-transparent px-6 py-3 font-body font-medium text-brand-sage transition duration-200 ease-out hover:border-brand-gold hover:text-brand-gold"
              >
                Powtórz błędne ({wrongOnly.length})
              </button>
            ) : null}
            <Link
              href={stationHref}
              className="font-body text-body-sm text-secondary transition-colors duration-200 ease-out hover:text-primary"
            >
              Wróć do stacji
            </Link>
          </div>
        </div>
      );
    }

    return (
      <TopicSessionSummary
        results={results}
        onRetryWrong={handleRetryWrong}
        hasWrong={wrongOnly.length > 0}
        nextTopicHref={nextTopicHref}
        stationHref={stationHref}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar — matches SessionTopBar layout */}
      <header className="sticky top-0 z-30 border-b border-border bg-background px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="shrink-0 rounded-pill bg-card px-4 py-1.5 font-body text-body-sm font-medium text-primary">
            {stationShortName}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-body text-body-sm text-secondary">
              Pytanie {index + 1} / {total}
            </p>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-brand-gold transition-[width] duration-[400ms] ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <p className="shrink-0 font-body text-body-md tabular-nums text-primary">
            {formatClock(timerSec)}
          </p>

          {knowledgeCard ? (
            <button
              type="button"
              onClick={() => setShowKnowledgeOverlay(true)}
              className="inline-flex items-center gap-1.5 rounded-pill border border-brand-sage/40 bg-card px-3 py-1.5 font-body text-body-xs text-brand-sage transition hover:bg-brand-sage/10"
              aria-label="Pokaż kartę wiedzy"
            >
              <BookOpen className="size-4 shrink-0" aria-hidden />
              Karta
            </button>
          ) : null}

          <a
            href={stationHref}
            className={cn(
              "ml-auto inline-flex shrink-0 items-center gap-1 font-body text-body-sm text-muted transition-colors duration-200 ease-out",
              "hover:text-error",
            )}
          >
            Zakończ
            <X className="size-4" aria-hidden />
          </a>
        </div>
      </header>

      {/* Scrollable question area */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-6 sm:px-8">
        {/* Collapsible exam tasks */}
        {hasExamTasks ? (
          <div className="mx-auto mb-6 w-full max-w-3xl">
            <button
              type="button"
              onClick={() => setTasksExpanded((v) => !v)}
              className="flex w-full items-center gap-2 rounded-card border border-brand-sage/25 bg-card px-4 py-3 text-left transition hover:border-brand-sage/40"
            >
              <ClipboardList className="size-4 shrink-0 text-brand-gold" aria-hidden />
              <span className="min-w-0 flex-1 font-body text-body-sm font-medium text-primary">
                Zadania na stacji
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted transition-transform duration-200",
                  tasksExpanded && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            <AnimatePresence initial={false}>
              {tasksExpanded ? (
                <motion.div
                  key="tasks-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <ul className="space-y-2 px-4 pb-3 pt-3">
                    {examTasks!.map((t) => (
                      <li key={t.task} className="font-body text-body-sm text-secondary">
                        <span className="font-semibold text-primary">Zadanie {t.task}:</span>{" "}
                        {t.description}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}

        {/* Topic breadcrumb */}
        <div className="mx-auto mb-2 w-full max-w-3xl">
          <span className="font-body text-body-xs text-muted">
            {stationShortName} · {topicName}
          </span>
        </div>

        {/* Question block */}
        <div className="mx-auto w-full max-w-3xl">
          {current ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {questionBlock}
              </motion.div>
            </AnimatePresence>
          ) : (
            questionBlock
          )}
        </div>
      </div>

      {showKnowledgeOverlay ? (
        <KnowledgeOverlay
          knowledgeCard={knowledgeCard}
          onClose={() => setShowKnowledgeOverlay(false)}
        />
      ) : null}
    </div>
  );
}
