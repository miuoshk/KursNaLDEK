"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { OsceExamTasksBox } from "@/features/osce/components/OsceExamTasksBox";
import { OsceSimulationQuestionBlock } from "@/features/osce/components/OsceSimulationQuestionBlock";
import {
  OSCE_SIM_PASS_THRESHOLD,
  OSCE_STATION_DURATION_SECONDS,
} from "@/features/osce/constants/osceSimulation";
import { fetchSimulationStationQuestions } from "@/features/osce/server/fetchSimulationStationQuestions";
import { saveOsceSimulationComplete } from "@/features/osce/server/saveOsceSimulation";
import type { OsceStation } from "@/features/osce/types";
import type { TopicSessionQuestionRow } from "@/features/osce/types";
import { cn } from "@/lib/utils";

export type OSCESimulationProps = {
  examDay: 1 | 2;
  stations: OsceStation[];
};

type Phase = "briefing" | "running" | "stationFeedback" | "final";

type StationOutcome = {
  stationId: string;
  stationOrder: number;
  correctCount: number;
  totalQuestions: number;
  durationSeconds: number;
  passed: boolean;
  percent: number;
  shortName: string;
};

function formatMmSs(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function OSCESimulation({ examDay, stations }: OSCESimulationProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("briefing");
  const [stationIndex, setStationIndex] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionQueue, setQuestionQueue] = useState<TopicSessionQuestionRow[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [remainingSec, setRemainingSec] = useState(OSCE_STATION_DURATION_SECONDS);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const answersRef = useRef<Record<string, boolean>>({});
  const queueRef = useRef<TopicSessionQuestionRow[]>([]);
  const stationStartedAtRef = useRef(0);
  const [outcomes, setOutcomes] = useState<StationOutcome[]>([]);
  const [feedback, setFeedback] = useState<{
    shortName: string;
    passed: boolean;
    percent: number;
  } | null>(null);
  const savedRef = useRef(false);
  const stationRoundDoneRef = useRef(false);

  const current = stations[stationIndex] ?? null;

  useEffect(() => {
    queueRef.current = questionQueue;
  }, [questionQueue]);

  const completeStation = useCallback(() => {
    if (stationRoundDoneRef.current) return;
    const queue = queueRef.current;
    const st = stations[stationIndex];
    if (!st) return;
    stationRoundDoneRef.current = true;

    for (const q of queue) {
      if (!(q.id in answersRef.current)) {
        answersRef.current[q.id] = false;
      }
    }
    setAnswers({ ...answersRef.current });

    const total = queue.length;
    const correctCount = queue.filter((q) => answersRef.current[q.id] === true).length;
    const pct = total > 0 ? correctCount / total : 0;
    const passed = pct >= OSCE_SIM_PASS_THRESHOLD;
    const percentRounded = total > 0 ? Math.round(pct * 100) : 0;
    const durationSeconds = Math.max(
      0,
      Math.round((Date.now() - stationStartedAtRef.current) / 1000),
    );

    setOutcomes((prev) => [
      ...prev,
      {
        stationId: st.id,
        stationOrder: stationIndex,
        correctCount,
        totalQuestions: total,
        durationSeconds,
        passed,
        percent: percentRounded,
        shortName: st.short_name,
      },
    ]);
    setFeedback({
      shortName: st.short_name,
      passed,
      percent: percentRounded,
    });
    setPhase("stationFeedback");
  }, [stationIndex, stations]);

  const handleStationTimeUpRef = useRef<() => void>(() => {});
  handleStationTimeUpRef.current = () => {
    completeStation();
  };

  useEffect(() => {
    if (phase !== "running" || !current) return;
    let cancelled = false;
    setLoadingQuestions(true);
    setQuestionQueue([]);
    void fetchSimulationStationQuestions(current.id).then((q) => {
      if (cancelled) return;
      stationRoundDoneRef.current = false;
      setQuestionQueue(q);
      setQIndex(0);
      answersRef.current = {};
      setAnswers({});
      stationStartedAtRef.current = Date.now();
      setRemainingSec(OSCE_STATION_DURATION_SECONDS);
      setLoadingQuestions(false);
    });
    return () => {
      cancelled = true;
    };
  }, [phase, stationIndex, current?.id]);

  useEffect(() => {
    if (phase !== "running" || loadingQuestions || questionQueue.length === 0) {
      return;
    }
    const t = window.setInterval(() => {
      setRemainingSec((r) => {
        if (r <= 1) {
          window.clearInterval(t);
          handleStationTimeUpRef.current();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase, loadingQuestions, questionQueue.length, stationIndex]);

  useEffect(() => {
    if (phase !== "running" || loadingQuestions) return;
    if (questionQueue.length > 0) return;
    const id = window.setTimeout(() => completeStation(), 0);
    return () => window.clearTimeout(id);
  }, [phase, loadingQuestions, questionQueue.length, completeStation]);

  const goNextQuestion = useCallback(() => {
    setQIndex((i) => {
      if (i + 1 >= questionQueue.length) {
        completeStation();
        return i;
      }
      return i + 1;
    });
  }, [questionQueue.length, completeStation]);

  const onRecordAnswer = useCallback((questionId: string, isCorrect: boolean) => {
    answersRef.current[questionId] = isCorrect;
    setAnswers((prev) => ({ ...prev, [questionId]: isCorrect }));
  }, []);

  useEffect(() => {
    if (phase !== "stationFeedback") return;
    const t = window.setTimeout(() => {
      if (stationIndex + 1 >= stations.length) {
        setPhase("final");
      } else {
        setStationIndex((i) => i + 1);
        setPhase("running");
      }
    }, 2500);
    return () => window.clearTimeout(t);
  }, [phase, stationIndex, stations.length]);

  useEffect(() => {
    if (phase !== "final" || savedRef.current || outcomes.length === 0) return;
    savedRef.current = true;
    void saveOsceSimulationComplete({
      examDay,
      stationResults: outcomes.map((o) => ({
        stationId: o.stationId,
        stationOrder: o.stationOrder,
        correctCount: o.correctCount,
        totalQuestions: o.totalQuestions,
        durationSeconds: o.durationSeconds,
      })),
    }).then(() => {
      router.refresh();
    });
  }, [phase, examDay, outcomes, router]);

  const currentQuestion = questionQueue[qIndex] ?? null;
  const passedOverall =
    outcomes.length > 0 && outcomes.every((o) => o.passed);
  const overallPercent =
    outcomes.length > 0
      ? Math.round(outcomes.reduce((s, o) => s + o.percent, 0) / outcomes.length)
      : 0;

  const failedStationIds = outcomes.filter((o) => !o.passed).map((o) => o.stationId);
  const retryHref =
    failedStationIds.length > 0
      ? `/osce/symulacja/${examDay}?only=${failedStationIds.map(encodeURIComponent).join(",")}`
      : null;

  if (stations.length === 0) {
    return (
      <p className="font-body text-body-md text-secondary">
        Brak stacji dla tego dnia. Sprawdź dane w panelu lub skontaktuj się z administratorem.
      </p>
    );
  }

  return (
    <div>
      {phase === "briefing" ? (
        <div className="rounded-card border border-border bg-card p-6">
          <h2 className="font-heading text-heading-sm text-primary">Przed startem</h2>
          <p className="mt-4 font-body text-body-md leading-relaxed text-secondary">
            Za chwilę rozpoczniesz symulację OSCE. Każda stacja ma 2 zadania. Próg zaliczenia: 60% z obu
            tasków łącznie. Czas jest ograniczony. Powodzenia!
          </p>
          <button
            type="button"
            onClick={() => {
              setStationIndex(0);
              setOutcomes([]);
              savedRef.current = false;
              setPhase("running");
            }}
            className="mt-8 rounded-btn bg-brand-gold px-8 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
          >
            Rozpocznij symulację
          </button>
        </div>
      ) : null}

      {phase === "running" && current ? (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-heading text-heading-sm text-primary">
              Stacja {stationIndex + 1} z {stations.length}: {current.short_name}
            </p>
            <div
              className={cn(
                "font-body text-body-lg tabular-nums",
                remainingSec <= 60 ? "text-error" : "text-brand-gold",
              )}
            >
              {formatMmSs(remainingSec)}
            </div>
          </div>
          <div className="mb-6 h-2 w-full overflow-hidden rounded-pill bg-white/[0.08]">
            <div
              className="h-full rounded-pill bg-brand-sage transition-[width] duration-1000 ease-linear"
              style={{
                width: `${(remainingSec / OSCE_STATION_DURATION_SECONDS) * 100}%`,
              }}
            />
          </div>

          <OsceExamTasksBox examTasks={current.exam_tasks} />

          {loadingQuestions ? (
            <p className="mt-8 font-body text-body-sm text-secondary">Ładowanie pytań…</p>
          ) : questionQueue.length === 0 ? (
            <p className="mt-8 font-body text-body-md text-error">
              Brak aktywnych pytań dla tej stacji. Stacja zostanie uznana za niezaliczoną.
            </p>
          ) : currentQuestion ? (
            <div className="mt-8" key={currentQuestion.id}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="font-body text-body-sm text-secondary">
                  Pytanie {qIndex + 1} z {questionQueue.length}
                </span>
              </div>
              <OsceSimulationQuestionBlock
                row={currentQuestion}
                onRecordAnswer={onRecordAnswer}
                onNext={goNextQuestion}
              />
            </div>
          ) : null}

        </div>
      ) : null}

      {phase === "stationFeedback" && feedback ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-card border border-border bg-card p-8 text-center"
        >
          <p className="font-heading text-heading-lg text-primary">{feedback.shortName}</p>
          <p
            className={cn(
              "mt-4 font-heading text-heading-xl",
              feedback.passed ? "text-success" : "text-error",
            )}
          >
            {feedback.passed ? "Stacja zaliczona" : "Stacja niezaliczona"}
          </p>
          <p className="mt-2 font-body text-body-lg text-secondary tabular-nums">{feedback.percent}%</p>
          <p className="mt-6 font-body text-body-sm text-muted">Za chwilę następna stacja…</p>
        </motion.div>
      ) : null}

      {phase === "final" ? (
        <div className="space-y-8">
          <div className="overflow-x-auto rounded-card border border-border bg-card">
            <table className="w-full min-w-[320px] border-collapse text-left font-body text-body-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-secondary">
                  <th className="px-4 py-3 font-medium">Stacja</th>
                  <th className="px-4 py-3 font-medium">Wynik</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {outcomes.map((o) => (
                  <tr key={o.stationId} className="border-b border-white/[0.06]">
                    <td className="px-4 py-3 text-primary">{o.shortName}</td>
                    <td className="px-4 py-3 font-body tabular-nums text-secondary">
                      {o.correctCount}/{o.totalQuestions} ({o.percent}%)
                    </td>
                    <td className={cn("px-4 py-3", o.passed ? "text-success" : "text-error")}>
                      {o.passed ? "Zaliczona" : "Niezaliczona"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center">
            <p className="font-body text-body-md text-secondary">
              Średni wynik ze stacji:{" "}
              <span className="font-body text-primary tabular-nums">{overallPercent}%</span>
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={passedOverall ? "ok" : "fail"}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "mt-6 font-heading text-heading-xl",
                  passedOverall ? "text-success" : "text-error",
                )}
              >
                {passedOverall ? "Zdany" : "Niezdany"}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            {retryHref ? (
              <Link
                href={retryHref}
                className="inline-flex items-center justify-center rounded-btn border border-brand-sage/50 bg-transparent px-6 py-3 font-body font-semibold text-brand-sage transition hover:bg-brand-sage/10"
              >
                Powtórz niezaliczone stacje
              </Link>
            ) : null}
            <Link
              href="/osce/symulacja"
              className="inline-flex items-center justify-center rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
            >
              Wróć do symulacji
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
