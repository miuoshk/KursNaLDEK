"use client";

import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

export function SummaryActions({ summary }: { summary: SessionSummaryData }) {
  const wrong = summary.answers.filter((a) => !a.isCorrect).length;

  return (
    <div className="flex flex-wrap items-center justify-end gap-4">
      <Link
        href={`/sesja/new?subject=${encodeURIComponent(summary.subjectId)}&mode=nauka&count=10`}
        className="rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
      >
        Rozpocznij kolejną sesję
      </Link>

      {wrong > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-btn border border-brand-sage bg-transparent px-6 py-3 font-body font-medium text-brand-sage opacity-60"
              >
                Powtórz błędne pytania ({wrong})
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs rounded-btn border border-[color:var(--border-subtle)] bg-brand-card-1 px-3 py-2 font-body text-body-xs text-primary"
          >
            Wkrótce
          </TooltipContent>
        </Tooltip>
      ) : null}

      <Link
        href={`/przedmioty/${encodeURIComponent(summary.subjectId)}`}
        className="font-body text-body-sm text-secondary transition-colors duration-200 ease-out hover:text-white"
      >
        Wróć do przedmiotu
      </Link>
    </div>
  );
}
