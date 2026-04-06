"use client";

import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { cn } from "@/lib/utils";

function stripBg(a: SessionSummaryData["answers"][0]) {
  if (a.isCorrect && a.confidence === "nie_wiedzialem") return "bg-brand-gold";
  if (a.isCorrect) return "bg-success";
  return "bg-error";
}

function tooltipLine(
  i: number,
  a: SessionSummaryData["answers"][0],
): string {
  const ok = a.isCorrect ? "Poprawna" : "Błędna";
  return `Pyt. ${i + 1}: ${ok} · ${a.timeSpentSeconds}s · Temat: ${a.topicName}`;
}

export function SummaryAnswerStrip({ summary }: { summary: SessionSummaryData }) {
  const [wrongOnly, setWrongOnly] = useState(false);
  const wrong = useMemo(
    () => summary.answers.filter((a) => !a.isCorrect),
    [summary.answers],
  );
  const totalSlots = summary.totalQuestions;
  const answers = summary.answers;

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-heading-sm text-primary">Przebieg sesji</h2>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: totalSlots }, (_, i) => {
          const a = answers[i];
          if (a) {
            return (
              <Tooltip key={a.questionId}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex size-8 items-center justify-center rounded-sm font-mono text-body-xs text-white/80",
                      stripBg(a),
                    )}
                  >
                    {i + 1}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs rounded-btn border border-[color:var(--border-subtle)] bg-brand-card-1 px-3 py-2 font-body text-body-xs text-primary"
                >
                  {tooltipLine(i, a)}
                </TooltipContent>
              </Tooltip>
            );
          }
          return (
            <div
              key={`empty-${i}`}
              className="flex size-8 items-center justify-center rounded-sm border border-dashed border-[rgba(255,255,255,0.12)] font-mono text-body-xs text-muted"
              aria-hidden
            >
              {i + 1}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 font-body text-body-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-success" aria-hidden />
          Poprawna
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-error" aria-hidden />
          Błędna
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand-gold" aria-hidden />
          Trafienie bez wiedzy
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full border border-[rgba(255,255,255,0.2)]" aria-hidden />
          Bez odpowiedzi
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 font-body text-body-sm text-secondary">
          <input
            type="checkbox"
            className="size-4 rounded border-[color:var(--border-subtle)] bg-brand-bg"
            checked={wrongOnly}
            onChange={(e) => setWrongOnly(e.target.checked)}
          />
          Pokaż tylko błędne
        </label>
      </div>

      {wrongOnly && wrong.length > 0 ? (
        <ul className="space-y-3 rounded-card border border-[color:var(--border-subtle)] bg-brand-bg/40 p-4">
          {wrong.map((a) => (
            <li key={a.questionId} className="font-body text-body-sm text-secondary">
              <p className="text-primary">{a.questionText}</p>
              <p className="mt-1">
                Twoja odpowiedź: {a.selectedOptionText} · Poprawna:{" "}
                {a.correctOptionText} · {a.topicName}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
