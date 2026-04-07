"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type OsceQuestionOption = { id: string; text: string };

export type OsceQuestionCardQuestion = {
  id: string;
  text: string;
  options: OsceQuestionOption[];
  correct_option_id: string;
  explanation: string;
  image_url?: string | null;
  question_type: string;
  timer_seconds?: number | null;
};

function shuffleOptions<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type TimerBarProps = {
  totalSeconds: number;
  remainingSeconds: number;
};

function TimerBar({ totalSeconds, remainingSeconds }: TimerBarProps) {
  const ratio = totalSeconds > 0 ? Math.max(0, remainingSeconds / totalSeconds) : 0;

  return (
    <div
      className="mb-6 w-full max-w-2xl"
      role="timer"
      aria-live="polite"
      aria-atomic
      aria-label={`Pozostały czas: ${remainingSeconds} sekund`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 font-body text-body-xs text-secondary">
          <Clock className="size-4 shrink-0 text-brand-gold" aria-hidden />
          Czas na odpowiedź
        </span>
        <span className="font-mono text-body-sm tabular-nums text-brand-gold">
          {remainingSeconds}s
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-pill bg-white/[0.08]">
        <motion.div
          className="h-full rounded-pill bg-brand-sage"
          initial={false}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export type OsceQuestionCardProps = {
  question: OsceQuestionCardQuestion;
  onAnswer: (questionId: string, selectedOptionId: string | null, isCorrect: boolean) => void;
  /** Wywoływany po ujawnieniu odpowiedzi (klik lub koniec czasu). */
  onNext: () => void;
};

export function QuestionCard({ question, onAnswer, onNext }: OsceQuestionCardProps) {
  const onAnswerRef = useRef(onAnswer);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  const shuffledOptions = useMemo(
    () => shuffleOptions(question.options),
    // Losujemy kolejność przy zmianie pytania (id), nie przy każdej referencji tablicy options.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tylko question.id
    [question.id],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const answeredOnceRef = useRef(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timerTotal =
    question.timer_seconds != null && question.timer_seconds > 0
      ? question.timer_seconds
      : null;
  const [remaining, setRemaining] = useState(() => timerTotal ?? 0);

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    answeredOnceRef.current = false;
    setSelectedId(null);
    setRevealed(false);
    const t = question.timer_seconds != null && question.timer_seconds > 0 ? question.timer_seconds : null;
    setRemaining(t ?? 0);
  }, [question.id, question.timer_seconds]);

  useEffect(() => {
    clearTimer();
    if (revealed || timerTotal == null) return;

    timerIntervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          if (!answeredOnceRef.current) {
            answeredOnceRef.current = true;
            setRevealed(true);
            onAnswerRef.current(question.id, null, false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [question.id, timerTotal, revealed, clearTimer]);

  const handleOptionClick = (optionId: string) => {
    if (revealed) return;
    clearTimer();
    if (answeredOnceRef.current) return;
    answeredOnceRef.current = true;
    setSelectedId(optionId);
    setRevealed(true);
    const isCorrect = optionId === question.correct_option_id;
    onAnswerRef.current(question.id, optionId, isCorrect);
  };

  const optionSurfaceClass =
    "flex w-full max-w-2xl items-center justify-center rounded-card border px-4 py-4 text-center font-body text-body-md leading-snug text-primary transition-colors duration-200 ease-out";

  return (
    <div className="mx-auto w-full max-w-2xl bg-brand-bg">
      {timerTotal != null ? (
        <TimerBar totalSeconds={timerTotal} remainingSeconds={remaining} />
      ) : null}

      {question.image_url ? (
        <div className="relative mb-6 h-64 w-full overflow-hidden rounded-card border border-white/[0.06] bg-brand-card-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- zewnętrzne URL (np. Supabase) bez domen w next.config */}
          <img
            src={question.image_url}
            alt=""
            className="h-full w-full object-contain"
          />
        </div>
      ) : null}

      <p className="font-body text-body-lg leading-relaxed text-primary">{question.text}</p>

      <div className="mt-6 flex flex-col items-center gap-3">
        {shuffledOptions.map((opt) => {
          const isCorrect = opt.id === question.correct_option_id;
          const isSelected = selectedId === opt.id;
          let surface = "border-brand-sage/50 bg-brand-card-1 hover:border-brand-sage hover:bg-brand-card-2";
          if (revealed) {
            if (isCorrect) {
              surface = "border-success bg-success/10";
            } else if (isSelected) {
              surface = "border-error bg-error/10";
            } else {
              surface = "border-white/[0.06] bg-brand-card-1 opacity-80";
            }
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={revealed}
              onClick={() => handleOptionClick(opt.id)}
              className={cn(
                optionSurfaceClass,
                "min-h-[5.5rem] w-full max-w-2xl font-normal",
                surface,
                revealed && "cursor-default",
                !revealed && "cursor-pointer",
              )}
            >
              <span className="w-full hyphens-auto break-words">{opt.text}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {revealed ? (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-8 rounded-card border border-white/[0.08] bg-brand-card-1 p-5"
          >
            <p className="font-heading text-heading-sm text-brand-gold">Wyjaśnienie</p>
            <p className="mt-3 whitespace-pre-wrap font-body text-body-sm leading-relaxed text-secondary">
              {question.explanation}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {revealed ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onNext}
            className="rounded-btn bg-brand-gold px-8 py-3 font-body text-body-md font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
          >
            Następne pytanie
          </button>
        </div>
      ) : null}
    </div>
  );
}
