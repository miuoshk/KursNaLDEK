"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import {
  fetchQuestionCopyText,
  fetchQuestionCopyTextWithReport,
} from "@/features/admin/server/adminActions";
import { cn } from "@/lib/utils";

type CopyMode = "question" | "withReport";

type CopyQuestionActionsProps = {
  questionId: string;
  report: {
    description: string;
  };
};

export function CopyQuestionActions({
  questionId,
  report,
}: CopyQuestionActionsProps) {
  const [activeMode, setActiveMode] = useState<CopyMode | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "copied" | "error">(
    "idle",
  );

  const handleCopy = useCallback(
    async (mode: CopyMode) => {
      if (state === "loading") return;
      setActiveMode(mode);
      setState("loading");
      try {
        const res =
          mode === "question"
            ? await fetchQuestionCopyText(questionId)
            : await fetchQuestionCopyTextWithReport(questionId, report);
        if (!res.ok) {
          setState("error");
          return;
        }
        await navigator.clipboard.writeText(res.text);
        setState("copied");
        window.setTimeout(() => {
          setState("idle");
          setActiveMode(null);
        }, 2000);
      } catch {
        setState("error");
        window.setTimeout(() => {
          setState("idle");
          setActiveMode(null);
        }, 2500);
      }
    },
    [questionId, report, state],
  );

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <CopyActionButton
        label="Kopiuj pytanie"
        copiedLabel="Skopiowano pytanie"
        mode="question"
        activeMode={activeMode}
        state={state}
        onCopy={handleCopy}
      />
      <CopyActionButton
        label="Kopiuj ze zgłoszeniem"
        copiedLabel="Skopiowano ze zgłoszeniem"
        mode="withReport"
        activeMode={activeMode}
        state={state}
        onCopy={handleCopy}
        variant="gold"
      />
    </div>
  );
}

function CopyActionButton({
  label,
  copiedLabel,
  mode,
  activeMode,
  state,
  onCopy,
  variant = "default",
}: {
  label: string;
  copiedLabel: string;
  mode: CopyMode;
  activeMode: CopyMode | null;
  state: "idle" | "loading" | "copied" | "error";
  onCopy: (mode: CopyMode) => void;
  variant?: "default" | "gold";
}) {
  const isActive = activeMode === mode;
  const loading = state === "loading" && isActive;
  const copied = state === "copied" && isActive;
  const errored = state === "error" && isActive;

  const text = loading
    ? "Kopiowanie…"
    : copied
      ? copiedLabel
      : errored
        ? "Błąd kopiowania"
        : label;

  return (
    <button
      type="button"
      onClick={() => void onCopy(mode)}
      disabled={state === "loading"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-btn border px-3 py-1.5 font-body text-body-xs transition-colors",
        copied
          ? "border-success/30 bg-success/10 text-success"
          : errored
            ? "border-error/30 bg-error/10 text-error"
            : variant === "gold"
              ? "border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10"
              : "border-border text-secondary hover:bg-white/[0.04] hover:text-primary",
      )}
      title={
        mode === "question"
          ? "Kopiuj pytanie jako tekst"
          : "Kopiuj pytanie wraz z opisem zgłoszenia użytkownika"
      }
    >
      {loading ? (
        <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden />
      ) : copied ? (
        <Check className="size-3 shrink-0" aria-hidden />
      ) : (
        <Copy className="size-3 shrink-0" aria-hidden />
      )}
      {text}
    </button>
  );
}
