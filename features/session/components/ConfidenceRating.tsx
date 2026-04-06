"use client";

import { AlertCircle, CircleDot, Sparkles } from "lucide-react";
import type { Confidence } from "@/features/session/types";
import { cn } from "@/lib/utils";

type ConfidenceRatingProps = {
  value: Confidence | null;
  onChange: (c: Confidence) => void;
  disabled: boolean;
};

const items: {
  id: Confidence;
  label: string;
  icon: typeof AlertCircle;
  styles: string;
}[] = [
  {
    id: "nie_wiedzialem",
    label: "Nie wiedziałem",
    icon: AlertCircle,
    styles:
      "border-error/20 bg-error/[0.08] text-error hover:border-error/40",
  },
  {
    id: "troche",
    label: "Trochę wiedziałem",
    icon: CircleDot,
    styles:
      "border-brand-gold/20 bg-brand-gold/[0.08] text-brand-gold hover:border-brand-gold/40",
  },
  {
    id: "na_pewno",
    label: "Wiedziałem na pewno",
    icon: Sparkles,
    styles:
      "border-success/20 bg-success/[0.08] text-success hover:border-success/40",
  },
];

export function ConfidenceRating({
  value,
  onChange,
  disabled,
}: ConfidenceRatingProps) {
  return (
    <div className="mx-auto mt-8 w-full max-w-3xl">
      <p className="font-body text-body-md font-medium text-primary">
        Jak dobrze znałeś odpowiedź?
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map(({ id, label, icon: Icon, styles }) => {
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(id)}
              className={cn(
                "flex items-center gap-2 rounded-card border px-3 py-3 text-left font-body text-body-sm font-medium transition-all duration-200 ease-out",
                styles,
                active && "ring-1 ring-white/20",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
