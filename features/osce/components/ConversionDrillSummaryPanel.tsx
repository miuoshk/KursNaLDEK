"use client";

import { motion } from "framer-motion";
import type {
  ConversionDrillQuestionItem,
  ConversionDrillRoundResult,
  ConversionDrillSummary,
} from "@/features/osce/components/ConversionDrillQuestion";

export type ConversionDrillSummaryPanelProps = {
  results: ConversionDrillRoundResult[];
  questions: ConversionDrillQuestionItem[];
  onContinue?: () => void;
};

export function ConversionDrillSummaryPanel({
  results,
  questions,
  onContinue,
}: ConversionDrillSummaryPanelProps) {
  const list = results;
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
      className="mx-auto w-full max-w-lg rounded-card border border-brand-gold/35 bg-card p-6"
    >
      <h2 className="font-heading text-heading-lg text-brand-gold">Koniec serii</h2>
      <dl className="mt-6 space-y-4 font-body text-body-md text-secondary">
        <div className="flex justify-between gap-4">
          <dt>Wynik</dt>
          <dd className="font-body text-primary">
            {correct} / {list.length}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Średni czas odpowiedzi</dt>
          <dd className="font-body text-primary">{averageMs} ms</dd>
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
      {onContinue ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-btn bg-brand-gold px-8 py-3 font-body text-body-md font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
          >
            Następne pytanie
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
