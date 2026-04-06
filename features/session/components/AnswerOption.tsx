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
          "border-[rgba(255,255,255,0.08)] bg-brand-card-1 hover:border-brand-sage/50 hover:bg-brand-card-1/80",
        state === "selected" && "border-brand-gold bg-brand-gold/[0.06]",
        state === "correct" && "border-success/60 bg-success/[0.06]",
        state === "wrong" && "border-error/60 bg-error/[0.06]",
        state === "muted" && "border-[rgba(255,255,255,0.06)] bg-brand-bg/40 opacity-50",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-body-sm font-medium transition-colors duration-200",
          state === "default" && "border-transparent bg-[rgba(255,255,255,0.06)] text-secondary",
          state === "selected" && "border-brand-gold bg-brand-gold text-brand-bg",
          state === "correct" && "border-success bg-success text-brand-bg",
          state === "wrong" && "border-error bg-error text-brand-bg",
          state === "muted" && "border-[rgba(255,255,255,0.1)] bg-brand-bg text-muted",
        )}
      >
        {letter}
      </span>
      <span className="min-w-0 flex-1 font-body text-body-md text-primary">{text}</span>
    </button>
  );
}
