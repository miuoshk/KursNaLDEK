"use client";

import { Check, X } from "lucide-react";
import { useMemo } from "react";
import type { ImageIdentifyHotspot } from "@/features/osce/components/ImageIdentifyQuestion";
import { QuestionFooterActions } from "@/features/shared/components/QuestionFooterActions";
import { cn } from "@/lib/utils";

export type ImageIdentifyFormProps = {
  formId: string;
  questionId: string;
  questionText: string;
  hotspots: ImageIdentifyHotspot[];
  mode: "identify" | "label";
  labelOptions: string[];
  identifySelections: Record<string, string>;
  labelStep: number;
  labelOutcome: Record<string, boolean>;
  checked: boolean;
  labelComplete: boolean;
  onIdentifyChange: (hotspotId: string, value: string) => void;
  onLabelSelect: (value: string) => void;
  onCheck: () => void;
  onResetView: () => void;
};

export function ImageIdentifyForm({
  formId,
  questionId,
  questionText,
  hotspots,
  mode,
  labelOptions,
  identifySelections,
  labelStep: _labelStep,
  labelOutcome: _labelOutcome,
  checked,
  labelComplete,
  onIdentifyChange,
  onLabelSelect: _onLabelSelect,
  onCheck,
  onResetView,
}: ImageIdentifyFormProps) {
  void _labelStep;
  void _labelOutcome;
  void _onLabelSelect;

  const sortedHotspots = useMemo(
    () => [...hotspots].sort((a, b) => a.id.localeCompare(b.id)),
    [hotspots],
  );

  return (
    <>
      {mode === "identify" ? (
        <div className="mt-8 space-y-4">
          {sortedHotspots.map((h, i) => (
            <div
              key={h.id}
              className="flex flex-col gap-2 rounded-card border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-6"
            >
              <span className="shrink-0 font-body text-body-sm text-brand-gold">
                {i + 1}.
              </span>
              <label htmlFor={`${formId}-sel-${h.id}`} className="sr-only">
                Wybór dla punktu {i + 1}
              </label>
              <select
                id={`${formId}-sel-${h.id}`}
                disabled={checked}
                value={identifySelections[h.id] ?? ""}
                onChange={(e) => onIdentifyChange(h.id, e.target.value)}
                className={cn(
                  "w-full rounded-btn border border-brand-sage/40 bg-background px-3 py-2.5 font-body text-body-md text-primary",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold",
                  checked &&
                    identifySelections[h.id]?.trim() === h.correct_label &&
                    "border-success",
                  checked &&
                    identifySelections[h.id]?.trim() !== h.correct_label &&
                    "border-error",
                )}
              >
                <option value="">Wybierz nazwę…</option>
                {labelOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {checked ? (
                identifySelections[h.id]?.trim() === h.correct_label ? (
                  <Check className="size-5 shrink-0 text-success" aria-label="Dobrze" />
                ) : (
                  <X className="size-5 shrink-0 text-error" aria-label="Źle" />
                )
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 font-body text-body-sm text-secondary">
          {labelComplete && !checked ? (
            <p className="text-brand-gold">Wszystkie punkty wskazane. Sprawdź odpowiedzi.</p>
          ) : null}
        </div>
      )}

      {!checked ? (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onCheck}
              disabled={mode === "identify" ? false : !labelComplete}
              className={cn(
                "rounded-btn px-8 py-3 font-body text-body-md font-semibold transition duration-200 ease-out",
                mode === "label" && !labelComplete
                  ? "cursor-not-allowed bg-white/10 text-muted"
                  : "bg-brand-gold text-brand-bg hover:brightness-110",
              )}
            >
              Sprawdź
            </button>
            <button
              type="button"
              onClick={onResetView}
              className="rounded-btn border border-brand-sage/40 px-4 py-2 font-body text-body-sm text-brand-sage transition hover:bg-brand-sage/10"
            >
              Reset widoku
            </button>
          </div>
          <QuestionFooterActions questionId={questionId} questionText={questionText} />
        </>
      ) : null}
    </>
  );
}
