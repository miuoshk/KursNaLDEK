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
    <header className="sticky top-0 z-30 border-b border-[color:var(--border-subtle)] bg-brand-bg px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="shrink-0 rounded-pill bg-brand-card-1 px-4 py-1.5 font-body text-body-sm font-medium text-primary">
          {subjectName}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-body-sm text-secondary">
            Pytanie {current + 1} / {total}
          </p>
          <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
            <div
              className="h-full rounded-full bg-brand-gold transition-[width] duration-[400ms] ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

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
    </header>
  );
}
