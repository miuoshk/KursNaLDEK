"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { completeSession } from "@/features/session/api/completeSession";
import { submitAnswer } from "@/features/session/api/submitAnswer";
import type {
  ConversionDrillRoundResult,
  ConversionDrillSummary,
} from "@/features/osce/components/ConversionDrillQuestion";
import { ConversionDrillQuestion } from "@/features/osce/components/ConversionDrillQuestion";
import { ImageIdentifyQuestion } from "@/features/osce/components/ImageIdentifyQuestion";
import type { ImageIdentifyAnswer } from "@/features/osce/components/ImageIdentifyQuestion";
import { OrderingQuestion } from "@/features/osce/components/OrderingQuestion";
import { QuestionCard } from "@/features/osce/components/QuestionCard";
import { createOsceTopicSession } from "@/features/osce/server/createOsceTopicSession";
import { encodeTopicAnswerSelection } from "@/features/osce/lib/encodeTopicAnswer";
import {
  resolveOsceQuestionKind,
  toOsceConversionItems,
  toOsceImageIdentify,
  toOsceOrdering,
  toOsceSingleChoice,
} from "@/features/osce/lib/topicQuestionMappers";
import type { TopicSessionQuestionRow } from "@/features/osce/types";
import { cn } from "@/lib/utils";

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
};

type Phase = "intro" | "questions" | "summary";

type ResultRow = {
  questionId: string;
  label: string;
  isCorrect: boolean;
};

function truncateLabel(text: string, max = 96): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
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
}: TopicSessionProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [showKnowledgeOverlay, setShowKnowledgeOverlay] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [queue, setQueue] = useState<TopicSessionQuestionRow[]>(initialQuestions);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [retryMode, setRetryMode] = useState(false);

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
    void completeSession({ sessionId }).catch(() => {
      completedRef.current = false;
    });
  }, [phase, sessionId]);

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

  const correctCount = useMemo(
    () => results.filter((r) => r.isCorrect).length,
    [results],
  );
  const pct =
    results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

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
    setSessionId(created.sessionId);
    setQueue(wrongOnly);
    setResults([]);
    setIndex(0);
    setRetryMode(true);
    setPhase("questions");
  }, [wrongOnly, stationId, topicId]);

  const nextTopicHref =
    nextTopicId != null ? `/osce/${stationId}/${nextTopicId}` : null;

  const markdownBlock = (md: string) => (
    <div
      className={cn(
        "font-body text-body-md leading-relaxed text-secondary",
        "[&_a]:text-brand-sage [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand-gold",
        "[&_p]:mt-3 [&_p:first-child]:mt-0",
        "[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:font-mono [&_code]:text-body-sm",
        "[&_strong]:font-semibold [&_strong]:text-primary",
        "[&_h2]:mt-6 [&_h2]:font-heading [&_h2]:text-heading-sm [&_h2]:text-primary",
        "[&_h3]:mt-4 [&_h3]:font-heading [&_h3]:text-body-lg [&_h3]:text-primary",
      )}
    >
      <ReactMarkdown>{md}</ReactMarkdown>
    </div>
  );

  const introBlock = (
    <div className="rounded-card border border-[color:var(--border-subtle)] bg-brand-card-1 p-6">
      <h2 className="font-heading text-heading-sm text-primary">Karta wiedzy</h2>
      {knowledgeCard && knowledgeCard.trim().length > 0 ? (
        <div className="mt-4">{markdownBlock(knowledgeCard)}</div>
      ) : (
        <p className="mt-4 font-body text-body-sm text-secondary">
          Brak karty wiedzy dla tego tematu. Możesz od razu przejść do pytań.
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setPhase("questions");
          setShowKnowledgeOverlay(false);
        }}
        className="mt-8 w-full rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110 sm:w-auto"
      >
        Rozumiem, przejdź do pytań
      </button>
    </div>
  );

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

  return (
    <div className="relative">
      <div className="pointer-events-none absolute right-0 top-0 z-20 flex justify-end sm:right-0">
        {phase === "questions" ? (
          <button
            type="button"
            onClick={() => setShowKnowledgeOverlay(true)}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-pill border border-brand-sage/40 bg-brand-card-1 px-3 py-2 font-body text-body-xs text-brand-sage transition hover:bg-brand-sage/10"
            aria-label="Pokaż kartę wiedzy"
          >
            <BookOpen className="size-4 shrink-0" aria-hidden />
            Karta
          </button>
        ) : null}
      </div>

      {phase === "intro" && !retryMode ? (
        introBlock
      ) : phase === "questions" ? (
        <div>
          {total > 0 ? (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-body text-body-sm text-secondary">
                  Pytanie {index + 1} z {total}
                </span>
                <span className="font-mono text-body-xs text-muted tabular-nums">
                  {stationShortName} · {topicName}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-pill bg-white/[0.08]">
                <div
                  className="h-full rounded-pill bg-brand-sage transition-[width] duration-200 ease-out"
                  style={{ width: `${((index + 1) / total) * 100}%` }}
                />
              </div>
            </div>
          ) : null}

          {current ? <div key={current.id}>{questionBlock}</div> : questionBlock}
        </div>
      ) : (
        <div className="rounded-card border border-[color:var(--border-subtle)] bg-brand-card-1 p-6">
          <h2 className="font-heading text-heading-sm text-primary">Podsumowanie</h2>
          <p className="mt-3 font-body text-body-lg text-secondary">
            Wynik:{" "}
            <span className="font-mono text-primary tabular-nums">
              {correctCount} / {results.length}
            </span>{" "}
            prawidłowych ({pct}%)
          </p>

          <ul className="mt-6 space-y-2 border-t border-white/[0.06] pt-6">
            {results.map((r) => (
              <li
                key={r.questionId}
                className="flex gap-3 font-body text-body-sm text-secondary"
              >
                <span className="shrink-0 font-mono text-primary" aria-hidden>
                  {r.isCorrect ? "✓" : "✗"}
                </span>
                <span>{r.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {wrongOnly.length > 0 ? (
              <button
                type="button"
                onClick={() => void handleRetryWrong()}
                className="rounded-btn border border-brand-sage/50 bg-transparent px-6 py-3 font-body font-semibold text-brand-sage transition hover:bg-brand-sage/10"
              >
                Powtórz błędne
              </button>
            ) : null}
            {nextTopicHref ? (
              <Link
                href={nextTopicHref}
                className="inline-flex items-center justify-center rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
              >
                Następny topik
              </Link>
            ) : null}
            <Link
              href={stationHref}
              className="inline-flex items-center justify-center rounded-btn border border-white/[0.12] bg-transparent px-6 py-3 font-body font-semibold text-primary transition hover:bg-white/[0.06]"
            >
              Wróć do stacji
            </Link>
          </div>
        </div>
      )}

      {showKnowledgeOverlay ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-label="Karta wiedzy"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-card border border-[color:var(--border-subtle)] bg-brand-bg p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-heading text-heading-sm text-primary">Karta wiedzy</h2>
              <button
                type="button"
                onClick={() => setShowKnowledgeOverlay(false)}
                className="rounded-btn border border-white/[0.12] px-3 py-1.5 font-body text-body-sm text-secondary hover:bg-white/[0.06]"
              >
                Zamknij
              </button>
            </div>
            <div className="mt-4">
              {knowledgeCard && knowledgeCard.trim().length > 0 ? (
                markdownBlock(knowledgeCard)
              ) : (
                <p className="font-body text-body-sm text-secondary">
                  Brak karty wiedzy dla tego tematu.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
