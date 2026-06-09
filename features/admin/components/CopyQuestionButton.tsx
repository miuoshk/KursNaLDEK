"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { fetchQuestionCopyText } from "@/features/admin/server/adminActions";
import { cn } from "@/lib/utils";

type CopyQuestionButtonProps = {
  questionId: string;
  className?: string;
};

export function CopyQuestionButton({
  questionId,
  className,
}: CopyQuestionButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "copied" | "error">(
    "idle",
  );

  const handleCopy = useCallback(async () => {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetchQuestionCopyText(questionId);
      if (!res.ok) {
        setState("error");
        return;
      }
      await navigator.clipboard.writeText(res.text);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 2500);
    }
  }, [questionId, state]);

  const label =
    state === "loading"
      ? "Kopiowanie…"
      : state === "copied"
        ? "Skopiowano"
        : state === "error"
          ? "Błąd kopiowania"
          : "Kopiuj pytanie";

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={state === "loading"}
      className={cn(
        "inline-flex items-center gap-1 text-left font-body text-body-xs transition-colors",
        state === "copied"
          ? "text-success"
          : state === "error"
            ? "text-error"
            : "text-secondary hover:text-white",
        className,
      )}
      title="Kopiuj pytanie jako tekst (przedmiot, temat, treść, opcje, wyjaśnienie)"
    >
      {state === "loading" ? (
        <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden />
      ) : state === "copied" ? (
        <Check className="size-3 shrink-0" aria-hidden />
      ) : (
        <Copy className="size-3 shrink-0" aria-hidden />
      )}
      {label}
    </button>
  );
}
