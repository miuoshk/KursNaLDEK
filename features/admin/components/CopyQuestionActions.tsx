"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import {
  fetchQuestionCopyText,
  fetchQuestionCopyTextWithReport,
} from "@/features/admin/server/adminActions";
import { copyTextAfterAsyncFetch, copyTextToClipboard } from "@/lib/copyToClipboard";
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
  const [prefetchState, setPrefetchState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const cacheRef = useRef<{ question?: string; withReport?: string }>({});

  useEffect(() => {
    let cancelled = false;
    cacheRef.current = {};
    setPrefetchState("loading");

    void Promise.all([
      fetchQuestionCopyText(questionId),
      fetchQuestionCopyTextWithReport(questionId, report),
    ]).then(([plainRes, reportRes]) => {
      if (cancelled) return;
      if (!plainRes.ok || !reportRes.ok) {
        setPrefetchState("error");
        return;
      }
      cacheRef.current = {
        question: plainRes.text,
        withReport: reportRes.text,
      };
      setPrefetchState("ready");
    });

    return () => {
      cancelled = true;
    };
  }, [questionId, report.description]);

  const resetSoon = useCallback(() => {
    window.setTimeout(() => {
      setState("idle");
      setActiveMode(null);
    }, 2000);
  }, []);

  const handleCopy = useCallback(
    (mode: CopyMode) => {
      if (state === "loading") return;
      setActiveMode(mode);
      setState("loading");

      const cached =
        mode === "question"
          ? cacheRef.current.question
          : cacheRef.current.withReport;

      const fetchText = async (): Promise<string> => {
        if (cached) return cached;
        const res =
          mode === "question"
            ? await fetchQuestionCopyText(questionId)
            : await fetchQuestionCopyTextWithReport(questionId, report);
        if (!res.ok) {
          throw new Error(res.message);
        }
        return res.text;
      };

      void (async () => {
        try {
          const copied = cached
            ? await copyTextToClipboard(cached)
            : await copyTextAfterAsyncFetch(fetchText);

          if (!copied) {
            setState("error");
            window.setTimeout(() => {
              setState("idle");
              setActiveMode(null);
            }, 2500);
            return;
          }

          setState("copied");
          resetSoon();
        } catch {
          setState("error");
          window.setTimeout(() => {
            setState("idle");
            setActiveMode(null);
          }, 2500);
        }
      })();
    },
    [questionId, report, resetSoon, state],
  );

  const disabled = state === "loading" || prefetchState === "loading";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <CopyActionButton
          label="Kopiuj pytanie"
          copiedLabel="Skopiowano pytanie"
          mode="question"
          activeMode={activeMode}
          state={state}
          disabled={disabled}
          onCopy={handleCopy}
        />
        <CopyActionButton
          label="Kopiuj ze zgłoszeniem"
          copiedLabel="Skopiowano ze zgłoszeniem"
          mode="withReport"
          activeMode={activeMode}
          state={state}
          disabled={disabled}
          onCopy={handleCopy}
          variant="gold"
        />
      </div>
      {prefetchState === "loading" ? (
        <p className="font-body text-body-xs text-muted">Przygotowuję tekst…</p>
      ) : prefetchState === "error" ? (
        <p className="font-body text-body-xs text-error">
          Nie udało się wczytać treści — spróbuj ponownie za chwilę
        </p>
      ) : null}
    </div>
  );
}

function CopyActionButton({
  label,
  copiedLabel,
  mode,
  activeMode,
  state,
  disabled,
  onCopy,
  variant = "default",
}: {
  label: string;
  copiedLabel: string;
  mode: CopyMode;
  activeMode: CopyMode | null;
  state: "idle" | "loading" | "copied" | "error";
  disabled: boolean;
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
      onClick={() => onCopy(mode)}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-btn border px-3 py-1.5 font-body text-body-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
