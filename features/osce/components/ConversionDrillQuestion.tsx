"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ConversionDrillOption = { id: string; text: string };

export type ConversionDrillQuestionItem = {
  id: string;
  text: string;
  options: ConversionDrillOption[];
  correct_option_id: string;
  /** Domyślnie 10. */
  timer_seconds?: number;
};

export type ConversionDrillRoundResult = {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  elapsedMs: number;
};

export type ConversionDrillSummary = {
  correct: number;
  total: number;
  averageMs: number;
  slowest: { questionId: string; questionText: string; ms: number } | null;
  rounds: ConversionDrillRoundResult[];
};

export type ConversionDrillQuestionProps = {
  questions: ConversionDrillQuestionItem[];
  onAnswer?: (result: ConversionDrillRoundResult) => void;
  onTimeout?: (questionId: string) => void;
  onDrillComplete?: (summary: ConversionDrillSummary) => void;
  /** Po podsumowaniu serii — np. następne pytanie w sesji OSCE. */
  onContinueAfterDrill?: () => void;
  soundEnabled?: boolean;
};

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AC();
    }
    if (sharedAudioCtx.state === "suspended") {
      void sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playDing() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
  osc.start(t0);
  osc.stop(t0 + 0.15);
}

function playBuzz() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(180, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.1, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
  osc.start(t0);
  osc.stop(t0 + 0.22);
}

function monotonicNow(): number {
  if (typeof performance !== "undefined") return performance.now();
  return Date.now();
}

function shuffleOptions<T extends { id: string }>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "running" | "feedback" | "done";

const FEEDBACK_MS = 1500;
const RED_ZONE_S = 3;

export function ConversionDrillQuestion({
  questions,
  onAnswer,
  onTimeout,
  onDrillComplete,
  onContinueAfterDrill,
  soundEnabled = true,
}: ConversionDrillQuestionProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("running");
  const [feedbackOk, setFeedbackOk] = useState<boolean | null>(null);

  const [remaining, setRemaining] = useState(10);
  const roundStartRef = useRef<number>(0);
  const answeredRef = useRef(false);
  const timeoutFiredRef = useRef(false);

  const roundsRef = useRef<ConversionDrillRoundResult[]>([]);

  const current = questions[index];
  const total = questions.length;
  const timerSeconds = current ? current.timer_seconds ?? 10 : 10;

  const shuffledOptions = useMemo(
    () => (current ? shuffleOptions(current.options) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mieszanie tylko przy zmianie pytania (id)
    [current?.id],
  );

  useEffect(() => {
    if (!current) return;
    answeredRef.current = false;
    timeoutFiredRef.current = false;
    roundStartRef.current = monotonicNow();
    setRemaining(current.timer_seconds ?? 10);
    setFeedbackOk(null);
    setPhase("running");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset przy zmianie id/czasu; `current` byłby niestabilny
  }, [current?.id, current?.timer_seconds]);

  useEffect(() => {
    if (phase !== "running" || !current) return;

    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 0.05) {
          return 0;
        }
        return Math.max(0, r - 0.05);
      });
    }, 50);

    return () => clearInterval(id);
  }, [phase, current?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- interwał tylko przy rundzie

  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (phase !== "running" || !current || answeredRef.current) return;
    if (remaining > 0) return;
    if (roundsRef.current.some((r) => r.questionId === current.id)) return;

    timeoutFiredRef.current = true;
    onTimeoutRef.current?.(current.id);
    setFeedbackOk(false);
    setPhase("feedback");
    if (soundEnabled) playBuzz();

    const start = roundStartRef.current;
    const elapsedMs = Math.round(monotonicNow() - start);
    const result: ConversionDrillRoundResult = {
      questionId: current.id,
      selectedOptionId: null,
      isCorrect: false,
      elapsedMs: Math.min(elapsedMs, timerSeconds * 1000),
    };
    roundsRef.current = [...roundsRef.current, result];
  }, [remaining, phase, current, soundEnabled, timerSeconds]);

  const finishFeedbackAndAdvance = useCallback(() => {
    setFeedbackOk(null);
    if (index + 1 >= total) {
      setPhase("done");
      const list = roundsRef.current;
      const correct = list.filter((x) => x.isCorrect).length;
      const times = list.map((x) => x.elapsedMs);
      const averageMs =
        times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
      let slowest: ConversionDrillSummary["slowest"] = null;
      for (const r of list) {
        if (!slowest || r.elapsedMs > slowest.ms) {
          const q = questions.find((q) => q.id === r.questionId);
          slowest = {
            questionId: r.questionId,
            questionText: q?.text ?? r.questionId,
            ms: r.elapsedMs,
          };
        }
      }
      onDrillComplete?.({
        correct,
        total: list.length,
        averageMs,
        slowest,
        rounds: list,
      });
      return;
    }
    setIndex((i) => i + 1);
  }, [index, onDrillComplete, questions, total]);

  useEffect(() => {
    if (phase !== "feedback") return;
    const t = window.setTimeout(finishFeedbackAndAdvance, FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [phase, finishFeedbackAndAdvance]);

  const handleSelect = (optionId: string) => {
    if (!current || phase !== "running" || answeredRef.current || timeoutFiredRef.current) return;
    answeredRef.current = true;
    const start = roundStartRef.current;
    const elapsedMs = Math.round(monotonicNow() - start);
    const isCorrect = optionId === current.correct_option_id;
    const result: ConversionDrillRoundResult = {
      questionId: current.id,
      selectedOptionId: optionId,
      isCorrect,
      elapsedMs,
    };
    roundsRef.current = [...roundsRef.current, result];
    onAnswer?.(result);
    setFeedbackOk(isCorrect);
    setPhase("feedback");
    if (soundEnabled) {
      if (isCorrect) playDing();
      else playBuzz();
    }
  };

  const ratio = timerSeconds > 0 ? Math.max(0, remaining / timerSeconds) : 0;
  const urgent = remaining <= RED_ZONE_S && phase === "running";

  if (!questions.length) {
    return (
      <p className="font-body text-body-md text-muted">Brak pytań w serii.</p>
    );
  }

  if (phase === "done") {
    const list = roundsRef.current;
    const correct = list.filter((x) => x.isCorrect).length;
    const times = list.map((x) => x.elapsedMs);
    const averageMs =
      times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    let slowest: ConversionDrillSummary["slowest"] = null;
    for (const r of list) {
      if (!slowest || r.elapsedMs > slowest.ms) {
        const q = questions.find((q) => q.id === r.questionId);
        slowest = {
          questionId: r.questionId,
          questionText: q?.text ?? r.questionId,
          ms: r.elapsedMs,
        };
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto w-full max-w-lg rounded-card border border-brand-gold/35 bg-brand-card-1 p-6"
      >
        <h2 className="font-heading text-heading-lg text-brand-gold">Koniec serii</h2>
        <dl className="mt-6 space-y-4 font-body text-body-md text-secondary">
          <div className="flex justify-between gap-4">
            <dt>Wynik</dt>
            <dd className="font-mono text-primary">
              {correct} / {list.length}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Średni czas odpowiedzi</dt>
            <dd className="font-mono text-primary">{averageMs} ms</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt>Najwolniejsze pytanie</dt>
            <dd className="text-left font-body text-body-sm leading-snug text-primary">
              {slowest ? (
                <>
                  <span className="block text-muted">{slowest.ms} ms</span>
                  <span className="mt-1 block">{slowest.questionText}</span>
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
        {onContinueAfterDrill ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onContinueAfterDrill}
              className="rounded-btn bg-brand-gold px-8 py-3 font-body text-body-md font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
            >
              Następne pytanie
            </button>
          </div>
        ) : null}
      </motion.div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <AnimatePresence mode="wait">
        {feedbackOk !== null ? (
          <motion.div
            key="flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "pointer-events-none fixed inset-0 z-40",
              feedbackOk ? "bg-success" : "bg-error",
            )}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>

      <div
        className={cn(
          "relative z-10 rounded-card border border-[color:var(--border-subtle)] bg-brand-bg p-4 sm:p-6",
          phase === "feedback" &&
            feedbackOk === true &&
            "ring-2 ring-success/60 ring-offset-2 ring-offset-brand-bg",
          phase === "feedback" &&
            feedbackOk === false &&
            "ring-2 ring-error/60 ring-offset-2 ring-offset-brand-bg",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 font-body text-body-xs text-secondary">
            <Clock
              className={cn("size-4 shrink-0", urgent ? "text-error" : "text-brand-gold")}
              aria-hidden
            />
            {phase === "running" ? "Czas" : "Koniec rundy"}
          </span>
          <span
            className={cn(
              "font-mono text-body-lg tabular-nums",
              urgent ? "text-error" : "text-brand-gold",
            )}
          >
            {phase === "running" ? remaining.toFixed(1) : "0"}s
          </span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-pill bg-white/[0.08]">
          <motion.div
            className={cn("h-full rounded-pill", urgent ? "bg-error" : "bg-brand-sage")}
            initial={false}
            animate={{
              width: `${ratio * 100}%`,
            }}
            transition={{ duration: 0.05, ease: "linear" }}
          />
        </div>

        <p className="mt-8 text-center font-heading text-heading-xl leading-tight text-primary md:text-[28px]">
          {current?.text}
        </p>

        <p className="mt-2 text-center font-body text-body-xs text-muted">
          {index + 1} / {total}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {shuffledOptions.map((opt) => {
            const disabled = phase !== "running";
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(opt.id)}
                className={cn(
                  "w-full rounded-btn border-2 border-brand-sage/45 bg-brand-card-1 px-4 py-4 text-left font-body text-body-lg leading-snug text-primary transition duration-200 ease-out",
                  "min-h-[56px] hover:border-brand-gold hover:bg-brand-card-2 active:scale-[0.99]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold",
                  disabled && "cursor-default opacity-90",
                )}
              >
                {opt.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
