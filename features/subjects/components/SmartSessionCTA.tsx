"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Infinity as InfinityIcon } from "lucide-react";
import {
  SESSION_COUNT_PRESETS,
  sessionCountToPickerState,
} from "@/features/session/lib/sessionCount";
import { cn } from "@/lib/utils";

const PRESETS = SESSION_COUNT_PRESETS;
type PresetValue = (typeof PRESETS)[number] | "all" | null;

type SmartSessionCTAProps = {
  subjectId: string;
  availableQuestionCount: number;
  initialSessionCount: number;
};

function resolveCount(
  preset: PresetValue,
  custom: string,
  maxQ: number,
  fallback: number,
): number {
  if (preset === "all") return Math.max(1, maxQ);
  const parsed = parseInt(custom, 10);
  if (custom && !Number.isNaN(parsed) && parsed >= 1 && parsed <= maxQ) {
    return parsed;
  }
  if (typeof preset === "number") return Math.min(preset, Math.max(1, maxQ));
  return Math.min(fallback, Math.max(1, maxQ));
}

export function SmartSessionCTA({
  subjectId,
  availableQuestionCount,
  initialSessionCount,
}: SmartSessionCTAProps) {
  const maxQ = Math.max(1, availableQuestionCount);
  const smartInitial = sessionCountToPickerState(
    Math.min(initialSessionCount, maxQ),
  );
  const reviewInitial = sessionCountToPickerState(
    Math.min(initialSessionCount, maxQ),
  );

  const [smartPreset, setSmartPreset] = useState<PresetValue>(smartInitial.preset);
  const [smartCustom, setSmartCustom] = useState(smartInitial.custom);
  const [reviewPreset, setReviewPreset] = useState<PresetValue>(reviewInitial.preset);
  const [reviewCustom, setReviewCustom] = useState(reviewInitial.custom);

  const smartCount = resolveCount(
    smartPreset,
    smartCustom,
    maxQ,
    Math.min(initialSessionCount, maxQ),
  );
  const reviewCount = resolveCount(
    reviewPreset,
    reviewCustom,
    maxQ,
    Math.min(initialSessionCount, maxQ),
  );

  const smartHref = useMemo(() => {
    const q = new URLSearchParams({
      subject: subjectId,
      mode: "inteligentna",
      count: String(smartCount),
    });
    return `/sesja/new?${q.toString()}`;
  }, [subjectId, smartCount]);

  const reviewHref = useMemo(() => {
    const q = new URLSearchParams({
      subject: subjectId,
      mode: "przeglad",
      count: String(reviewCount),
    });
    return `/sesja/new?${q.toString()}`;
  }, [subjectId, reviewCount]);

  const catalogHref = useMemo(() => {
    const q = new URLSearchParams({
      subject: subjectId,
      mode: "katalog",
      count: "5000",
    });
    return `/sesja/new?${q.toString()}`;
  }, [subjectId]);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-primary">Rozpocznij naukę</h2>

      <div className="rounded-card border border-brand-sage/20 bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-heading-sm text-primary">
              Inteligentna sesja
            </h3>
            <p className="mt-2 font-body text-body-sm text-secondary">
              Algorytm dobierze pytania i zaplanuje powtórki na podstawie Twojej wiedzy
            </p>
          </div>
          <Link
            href={smartHref}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-sage px-6 py-3 font-body font-semibold text-white transition duration-200 ease-out hover:bg-[#4a9085] hover:shadow-[0_0_16px_rgba(54,115,104,0.4)]"
          >
            Rozpocznij sesję
          </Link>
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <p className="font-body text-body-xs uppercase tracking-normal text-muted">
            Liczba pytań
          </p>
          <PresetPicker
            preset={smartPreset}
            custom={smartCustom}
            maxQ={maxQ}
            onPresetChange={setSmartPreset}
            onCustomChange={setSmartCustom}
          />
          <p className="mt-2 font-body text-body-xs text-muted">
            Dostępnych pytań: {availableQuestionCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col rounded-card border border-border bg-card p-5">
          <h3 className="font-heading text-heading-sm text-primary">
            Nauka klasyczna
          </h3>
          <p className="mt-1 font-body text-body-sm text-secondary">
            Pytania bez algorytmu powtórek — traktuj jako zabawę
          </p>

          <div className="mt-4 border-t border-border pt-3">
            <p className="font-body text-body-xs uppercase tracking-normal text-muted">
              Liczba pytań
            </p>
            <PresetPicker
              preset={reviewPreset}
              custom={reviewCustom}
              maxQ={maxQ}
              onPresetChange={setReviewPreset}
              onCustomChange={setReviewCustom}
              compact
            />
          </div>

          <Link
            href={reviewHref}
            className="mt-4 inline-flex items-center self-start rounded-lg bg-brand-sage px-4 py-2 font-body text-body-sm font-medium text-white transition duration-200 ease-out hover:bg-[#4a9085] hover:shadow-[0_0_12px_rgba(54,115,104,0.35)]"
          >
            Rozpocznij
          </Link>
        </div>

        <div className="flex flex-col rounded-card border border-border bg-card p-5">
          <h3 className="font-heading text-heading-sm text-primary">
            Katalog pytań
          </h3>
          <p className="mt-1 font-body text-body-sm text-secondary">
            Przeglądaj wszystkie pytania i wyjaśnienia
          </p>
          <Link
            href={catalogHref}
            className="mt-auto inline-flex items-center self-start rounded-lg border border-brand-sage/40 px-4 py-2 font-body text-body-sm font-medium text-brand-sage transition-colors duration-200 hover:bg-brand-sage/10"
          >
            Przeglądaj
          </Link>
        </div>
      </div>
    </div>
  );
}

type PresetPickerProps = {
  preset: PresetValue;
  custom: string;
  maxQ: number;
  onPresetChange: (p: PresetValue) => void;
  onCustomChange: (v: string) => void;
  compact?: boolean;
};

function PresetPicker({
  preset,
  custom,
  maxQ,
  onPresetChange,
  onCustomChange,
  compact = false,
}: PresetPickerProps) {
  const pillClass = compact
    ? "flex h-7 min-w-[36px] items-center justify-center rounded-pill border px-1.5 font-body text-body-sm transition-colors"
    : "flex h-8 min-w-[40px] items-center justify-center rounded-pill border px-2 font-body text-body-sm transition-colors";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {PRESETS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => {
            onPresetChange(n);
            onCustomChange("");
          }}
          className={cn(
            pillClass,
            "cursor-pointer",
            preset === n
              ? "border-brand-sage bg-brand-sage font-semibold text-white"
              : "border-border bg-transparent text-secondary hover:text-primary",
          )}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          onPresetChange("all");
          onCustomChange("");
        }}
        className={cn(
          pillClass,
          "cursor-pointer",
          preset === "all"
            ? "border-brand-sage bg-brand-sage text-white"
            : "border-border bg-transparent text-secondary hover:text-primary",
        )}
        aria-label="Wszystkie pytania"
      >
        <InfinityIcon className="size-4" aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={maxQ}
        placeholder="..."
        value={custom}
        onChange={(e) => {
          onCustomChange(e.target.value);
          onPresetChange(null);
        }}
        onFocus={() => {
          if (!custom) onPresetChange(null);
        }}
        className={cn(
          "rounded-pill border border-border bg-white/[0.03] text-center font-body text-body-sm text-primary outline-none placeholder:text-muted focus:border-brand-sage",
          compact ? "h-7 w-[52px]" : "h-8 w-[56px]",
        )}
      />
      <span className="ml-auto font-body text-body-xs text-muted">pytań</span>
    </div>
  );
}
