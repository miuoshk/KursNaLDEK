"use client";

import { Check, X } from "lucide-react";
import { RichTextContent } from "@/features/shared/components/RichTextContent";
import { cn } from "@/lib/utils";

export type AnswerState = "default" | "selected" | "correct" | "wrong" | "muted";

type AnswerOptionProps = {
  letter: string;
  text: string;
  state: AnswerState;
  disabled: boolean;
  collapsed?: boolean;
  expanded?: boolean;
  statusLabel?: string;
  ariaLabel: string;
  onSelect: () => void;
};

export function AnswerOption({
  letter,
  text,
  state,
  disabled,
  collapsed = false,
  expanded = false,
  statusLabel,
  ariaLabel,
  onSelect,
}: AnswerOptionProps) {
  const isChoice = !disabled && !collapsed;
  const showStatus = Boolean(statusLabel) && (state === "correct" || state === "wrong");

  return (
    <button
      type="button"
      role={isChoice ? "radio" : undefined}
      aria-checked={isChoice ? state === "selected" : undefined}
      aria-expanded={state === "muted" ? expanded : undefined}
      aria-label={ariaLabel}
      disabled={disabled && state !== "muted"}
      onClick={onSelect}
      className={cn(
        "flex w-full text-left transition-all duration-200 ease-out",
        collapsed
          ? "min-h-11 items-center gap-3 rounded-card border border-border bg-card px-3 py-2"
          : "items-start gap-4 rounded-card border p-4",
        !collapsed &&
          state === "default" &&
          "border-border bg-card hover:border-brand-sage/50",
        !collapsed && state === "selected" && "border-brand-sage bg-brand-sage/10",
        !collapsed && state === "correct" && "border-success bg-success/15",
        !collapsed && state === "wrong" && "border-error bg-error/15",
        !collapsed && state === "muted" && "border-border bg-card",
        disabled && !collapsed && "cursor-default",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border font-body font-medium",
          collapsed ? "size-6 text-[11px]" : "size-8 text-body-sm",
          state === "default" && "border-border bg-background text-secondary",
          state === "selected" && "border-brand-sage bg-brand-sage text-white",
          state === "correct" && "border-success bg-success text-brand-bg",
          state === "wrong" && "border-error bg-error text-brand-bg",
          state === "muted" && "border-border bg-background text-secondary",
        )}
      >
        {letter}
      </span>
      {collapsed ? (
        <span className="min-w-0 flex-1 truncate font-body text-body-sm text-secondary">
          {text}
        </span>
      ) : (
        <span className="min-w-0 flex-1">
          <RichTextContent
            text={text}
            className="font-body text-body-md text-primary"
          />
          {showStatus ? (
            <span
              className={cn(
                "mt-2 flex items-center gap-1.5 font-body text-body-xs font-semibold",
                state === "correct" ? "text-success" : "text-error",
              )}
            >
              {state === "correct" ? (
                <Check className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <X className="size-3.5 shrink-0" aria-hidden />
              )}
              {statusLabel}
            </span>
          ) : null}
        </span>
      )}
    </button>
  );
}
