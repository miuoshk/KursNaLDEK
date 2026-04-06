"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionMode } from "@/features/session/types";

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type SessionTopBarProps = {
  subjectName: string;
  current: number;
  total: number;
  mode: SessionMode;
  examElapsedSeconds: number | null;
  onEnd: () => void;
};

export function SessionTopBar({
  subjectName,
  current,
  total,
  mode,
  examElapsedSeconds,
  onEnd,
}: SessionTopBarProps) {
  const pct = total > 0 ? Math.min(100, ((current + 1) / total) * 100) : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border-subtle)] bg-brand-bg">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <span className="shrink-0 rounded-pill bg-brand-card-1 px-4 py-1.5 font-body text-body-sm font-medium text-primary">
          {subjectName}
        </span>

        <p className="min-w-0 font-mono text-body-sm text-secondary">
          Pytanie {current + 1} / {total}
        </p>

        {mode === "egzamin" && examElapsedSeconds !== null ? (
          <p className="shrink-0 font-mono text-body-md text-primary">
            {formatClock(examElapsedSeconds)}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onEnd}
          className={cn(
            "ml-auto inline-flex shrink-0 items-center gap-1 font-body text-body-sm text-muted transition-colors duration-200 ease-out",
            "hover:text-error",
          )}
        >
          Zakończ sesję
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="h-[3px] w-full bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full bg-brand-gold transition-[width] duration-[400ms] ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </header>
  );
}
