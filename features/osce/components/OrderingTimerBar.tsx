"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export type TimerBarProps = {
  totalSeconds: number;
  remainingSeconds: number;
};

export function OrderingTimerBar({ totalSeconds, remainingSeconds }: TimerBarProps) {
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
          Czas na ułożenie
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
