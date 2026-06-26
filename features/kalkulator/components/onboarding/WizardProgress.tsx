"use client";

import { cn } from "@/lib/utils";

const STEP_LABELS = [
  "Gabinet",
  "Koszty stałe",
  "Stawki pracy",
  "Procedury startowe",
] as const;

export function WizardProgress({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-[color:var(--k-muted)]">
        Krok {step} z {STEP_LABELS.length}
      </p>
      <h2 className="mt-1 font-heading text-xl text-[color:var(--k-primary)]">
        {STEP_LABELS[step - 1]}
      </h2>
      <div className="mt-4 flex gap-2">
        {STEP_LABELS.map((_, index) => (
          <div
            key={STEP_LABELS[index]}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index + 1 <= step
                ? "bg-[color:var(--k-primary-light)]"
                : "bg-[color:var(--k-border)]",
            )}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
