"use client";

import { cn } from "@/lib/utils";
import {
  PRODUCT_TOUR_STEPS,
  type ProductTourTab,
} from "@/features/kalkulator/data/productTour";
import {
  wizardPrimaryButtonClassName,
  wizardSecondaryButtonClassName,
} from "@/features/kalkulator/components/onboarding/wizardStyles";

type Props = {
  stepIndex: number;
  onNext: () => void;
  onDismiss: () => void;
  onGoToTab: (tab: ProductTourTab) => void;
};

export function ProductTourCallout({ stepIndex, onNext, onDismiss, onGoToTab }: Props) {
  const step = PRODUCT_TOUR_STEPS[stepIndex];
  if (!step) return null;

  const isLast = stepIndex >= PRODUCT_TOUR_STEPS.length - 1;

  return (
    <aside
      className="rounded-[var(--k-radius-card)] border border-[color:var(--k-primary-light)]/40 bg-[color:var(--k-primary)]/5 p-4 shadow-sm"
      aria-live="polite"
      aria-label="Wprowadzenie do kalkulatora"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-body text-xs font-medium uppercase tracking-wide text-[color:var(--k-muted)]">
          Wskazówka {stepIndex + 1} / {PRODUCT_TOUR_STEPS.length}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="font-body text-xs text-[color:var(--k-muted)] underline-offset-2 hover:underline"
        >
          Pomiń
        </button>
      </div>
      <h3 className="mt-2 font-body text-sm font-semibold text-[color:var(--k-text)]">
        {step.title}
      </h3>
      <p className="mt-1 font-body text-sm text-[color:var(--k-muted)]">{step.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            onGoToTab(step.tab);
            if (isLast) onDismiss();
            else onNext();
          }}
          className={cn(wizardPrimaryButtonClassName, "px-4 py-2 text-sm")}
        >
          {isLast ? "Zamknij" : "Dalej"}
        </button>
        {!isLast ? (
          <button type="button" onClick={onDismiss} className={wizardSecondaryButtonClassName}>
            Nie pokazuj więcej
          </button>
        ) : null}
      </div>
    </aside>
  );
}
