"use client";

import { cn } from "@/lib/utils";

type SessionBottomBarProps = {
  current: number;
  total: number;
  canContinue: boolean;
  onNext: () => void;
};

export function SessionBottomBar({
  current,
  total,
  canContinue,
  onNext,
}: SessionBottomBarProps) {
  const pct = total > 0 ? Math.min(100, ((current + 1) / total) * 100) : 0;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-between gap-4 border-t border-[rgba(255,255,255,0.06)] bg-brand-bg/95 px-4 backdrop-blur sm:px-8",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-mono text-body-xs text-secondary">
          Pytanie {current + 1} / {total}
        </p>
        <div className="mt-1 h-1 max-w-[200px] overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
          <div
            className="h-full rounded-full bg-brand-gold transition-[width] duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        disabled={!canContinue}
        onClick={onNext}
        className={cn(
          "min-w-0 flex-1 rounded-btn bg-brand-gold px-4 py-2.5 font-body font-semibold text-brand-bg transition duration-200 ease-out sm:flex-none sm:shrink-0 sm:px-6",
          "hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50",
          "active:scale-[0.98]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
        )}
      >
        Następne pytanie →
      </button>
    </div>
  );
}
