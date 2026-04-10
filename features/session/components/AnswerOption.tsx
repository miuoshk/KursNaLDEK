"use client";

import { cn } from "@/lib/utils";

export type AnswerState = "default" | "selected" | "correct" | "wrong" | "muted";

type AnswerOptionProps = {
  letter: string;
  text: string;
  state: AnswerState;
  disabled: boolean;
  onSelect: () => void;
};

export function AnswerOption({
  letter,
  text,
  state,
  disabled,
  onSelect,
}: AnswerOptionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-4 rounded-card border p-4 text-left transition-all duration-200 ease-out",
        state === "default" &&
          "border-border bg-card hover:border-brand-sage/50",
        state === "selected" && "border-brand-gold bg-brand-gold/10",
        state === "correct" && "border-success bg-success/10",
        state === "wrong" && "border-error bg-error/10",
        state === "muted" && "border-border bg-background/40 opacity-50",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-body-sm font-medium transition-colors duration-200",
          state === "default" && "border-border bg-background text-secondary",
          state === "selected" && "border-brand-gold bg-brand-gold text-brand-bg",
          state === "correct" && "border-success bg-success text-brand-bg",
          state === "wrong" && "border-error bg-error text-brand-bg",
          state === "muted" && "border-border bg-background text-muted",
        )}
      >
        {letter}
      </span>
      <span className="min-w-0 flex-1 font-body text-body-md text-primary">{text}</span>
    </button>
  );
}
