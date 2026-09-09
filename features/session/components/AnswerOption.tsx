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
  checked?: boolean;
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
  checked = false,
  onSelect,
}: AnswerOptionProps) {
  const showStatus =
    Boolean(statusLabel) && (state === "correct" || state === "wrong");

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-expanded={state === "muted" ? expanded : undefined}
      aria-label={ariaLabel}
      disabled={disabled && state !== "muted"}
      onClick={onSelect}
      className={cn(
        "flex w-full text-left transition-colors duration-200 ease-out",
        collapsed
          ? "min-h-11 items-center gap-3 rounded-card border border-border bg-card px-3"
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
        <span className="min-w-0 flex-1 truncate font-body text-[16px] leading-[1.6] text-primary">
          {text}
        </span>
      ) : (
        <span className="min-w-0 flex-1">
          <RichTextContent
            text={text}
            className="break-words font-body text-[16px] leading-[1.6] text-primary md:text-[17px]"
          />
          <span
            className={cn(
              "mt-2 flex min-h-5 items-center gap-1.5 font-body text-body-xs font-semibold",
              !showStatus && "invisible",
              showStatus && (state === "correct" ? "text-success" : "text-error"),
            )}
            aria-hidden={!showStatus}
          >
            {showStatus && state === "wrong" ? (
              <X className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <Check className="size-3.5 shrink-0" aria-hidden />
            )}
            {showStatus ? statusLabel : null}
          </span>
        </span>
      )}
    </button>
  );
}
