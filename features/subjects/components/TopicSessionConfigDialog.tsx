"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Infinity as InfinityIcon,
  LayoutGrid,
  Lightbulb,
  X,
} from "lucide-react";
import {
  SESSION_COUNT_PRESETS,
  getSessionCountLabels,
  resolveSessionPickerCount,
  sessionCountToPickerState,
} from "@/features/session/lib/sessionCount";
import { cn } from "@/lib/utils";
import type { SourceFilter } from "@/features/session/types";
import {
  countForSource,
  type SourceFilterCounts,
} from "@/features/session/lib/sourceFilter";
import {
  isThinCemPool,
  sessionMixCounts,
} from "@/features/session/lib/questionSourceBadge";
import { SourceFilterBar } from "@/features/shared/components/SourceFilter";
import { Toggle } from "@/features/shared/components/Toggle";
import { Rycina } from "@/features/shared/components/Rycina";
import { RycinaEmblem } from "@/features/shared/components/RycinaEmblem";
import { SESSION_MODE_RYCINA } from "@/features/shared/lib/rycinaCatalog";
import { FEATURES } from "@/lib/featureFlags";
import { isSourceFilterLive } from "@/lib/products";

type TopicSessionConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectShortName: string;
  topicId: string;
  topicName: string;
  totalQuestions: number;
  answeredQuestions: number;
  initialSessionCount: number;
  hasKnowledgeCard?: boolean;
  onOpenKnowledgeCard?: () => void;
  product?: string;
  source?: SourceFilter;
  sourceEnabled?: boolean;
  topicCounts?: SourceFilterCounts | null;
};

const PRESETS = SESSION_COUNT_PRESETS;
type PresetValue = (typeof PRESETS)[number] | "all" | null;

function buildHref(
  subjectId: string,
  topicId: string,
  mode: string,
  count: number,
  source?: SourceFilter,
  fillOwn?: boolean,
) {
  const q = new URLSearchParams({
    subject: subjectId,
    topic: topicId,
    mode,
    count: String(count),
  });
  if (source && source !== "all") q.set("src", source);
  if (fillOwn) q.set("fillown", "1");
  return `/sesja/new?${q.toString()}`;
}

export function TopicSessionConfigDialog({
  open,
  onOpenChange,
  subjectId,
  subjectShortName,
  topicId,
  topicName,
  totalQuestions,
  answeredQuestions,
  initialSessionCount,
  hasKnowledgeCard = false,
  onOpenKnowledgeCard,
  product,
  source: inheritedSource = "all",
  sourceEnabled = false,
  topicCounts = null,
}: TopicSessionConfigDialogProps) {
  const t = useTranslations("subjects");
  const tSession = useTranslations("session");
  const tCommon = useTranslations("common");
  const tFilter = useTranslations("sourceFilter");
  const { questionsShort, allQuestionsAriaLabel } = getSessionCountLabels(tSession);
  const showSource =
    Boolean(product) &&
    sourceEnabled &&
    FEATURES.cemSource &&
    isSourceFilterLive(product);

  const [smartPreset, setSmartPreset] = useState<PresetValue>(null);
  const [smartCustom, setSmartCustom] = useState("");
  const [reviewPreset, setReviewPreset] = useState<PresetValue>(null);
  const [reviewCustom, setReviewCustom] = useState("");
  const [localSource, setLocalSource] = useState<SourceFilter>(inheritedSource);
  const [fillOwn, setFillOwn] = useState(true);

  useEffect(() => {
    setLocalSource(inheritedSource);
    setFillOwn(true);
  }, [inheritedSource, open]);

  const activeSource = showSource ? localSource : "all";
  const cemCount = topicCounts?.reference ?? 0;
  const ownCount = topicCounts?.own ?? 0;
  const filteredTotal =
    showSource && topicCounts
      ? countForSource(topicCounts, localSource)
      : totalQuestions;
  const thinCem = showSource && activeSource === "reference" && isThinCemPool(cemCount);
  const fillActive = thinCem && fillOwn;
  const poolTotal = fillActive
    ? cemCount + ownCount
    : filteredTotal;
  const maxQ = Math.max(1, poolTotal);
  const canStart = poolTotal > 0;
  const countFallback = Math.min(initialSessionCount, maxQ);
  const smartInitial = sessionCountToPickerState(countFallback);
  const reviewInitial = sessionCountToPickerState(countFallback);

  useEffect(() => {
    setSmartPreset(smartInitial.preset);
    setSmartCustom(smartInitial.custom);
    setReviewPreset(reviewInitial.preset);
    setReviewCustom(reviewInitial.custom);
  }, [topicId, poolTotal, open]);

  useEffect(() => {
    if (typeof smartPreset === "number" && smartPreset > poolTotal) {
      setSmartPreset("all");
      setSmartCustom("");
    }
    if (typeof reviewPreset === "number" && reviewPreset > poolTotal) {
      setReviewPreset("all");
      setReviewCustom("");
    }
  }, [poolTotal, smartPreset, reviewPreset]);

  const progressPct =
    totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0;

  const smartFinalCount = resolveSessionPickerCount(
    smartPreset,
    smartCustom,
    maxQ,
    countFallback,
  );
  const reviewFinalCount = resolveSessionPickerCount(
    reviewPreset,
    reviewCustom,
    maxQ,
    countFallback,
  );

  const smartMix = sessionMixCounts(
    smartFinalCount,
    cemCount,
    ownCount,
    fillActive,
  );
  const reviewMix = sessionMixCounts(
    reviewFinalCount,
    cemCount,
    ownCount,
    fillActive,
  );

  const smartHref = buildHref(
    subjectId,
    topicId,
    "inteligentna",
    smartFinalCount,
    activeSource,
    fillActive,
  );
  const reviewHref = buildHref(
    subjectId,
    topicId,
    "przeglad",
    reviewFinalCount,
    activeSource,
    fillActive,
  );
  const catalogHref = buildHref(subjectId, topicId, "katalog", 5000, activeSource);

  const altCardClass =
    "relative flex flex-col overflow-hidden rounded-card border border-border bg-card-hover p-4 transition-colors hover:border-brand-sage/25";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 flex flex-col",
            "rounded-t-[20px] border border-b-0 border-border bg-card",
            "max-h-[92vh] overflow-x-hidden",
            "lg:bottom-auto lg:left-1/2 lg:right-auto lg:top-1/2",
            "lg:-translate-x-1/2 lg:-translate-y-1/2",
            "lg:w-[min(580px,90vw)] lg:max-h-[85vh]",
            "lg:rounded-card lg:border-b",
            "animate-slide-up focus:outline-none",
          )}
        >
          {/* Close button */}
          <Dialog.Close
            className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-muted transition-colors hover:text-primary"
            aria-label={tCommon("close")}
          >
            <X className="size-3.5" aria-hidden />
          </Dialog.Close>

          {/* Header */}
          <div className="px-5 pt-5 pb-0 lg:px-7 lg:pt-6">
            <p className="font-body text-body-xs text-muted">
              {subjectShortName}
            </p>
            <Dialog.Title className="font-heading text-heading-sm text-primary lg:text-heading-md">
              {topicName}
            </Dialog.Title>
            <p className="mt-0.5 font-body text-body-sm text-secondary">
              {t("chooseStudyMode")}
            </p>
            {showSource && product && topicCounts ? (
              <SourceFilterBar
                className="mt-3"
                product={product}
                value={localSource}
                onChange={setLocalSource}
                counts={topicCounts}
                caption={tFilter("inheritedFromSubject")}
              />
            ) : null}
            {thinCem ? (
              <div className="mt-3 rounded-[10px] border border-brand-gold/25 bg-brand-gold/[0.07] px-3.5 py-3">
                <p className="font-body text-body-sm text-primary">
                  {tFilter("thinCemBar", { count: cemCount })}
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <p id="fill-own-label" className="font-body text-body-xs text-secondary">
                    {tFilter("fillWithOwn")}
                  </p>
                  <Toggle
                    checked={fillOwn}
                    onCheckedChange={setFillOwn}
                    aria-labelledby="fill-own-label"
                  />
                </div>
              </div>
            ) : null}

            {/* Progress bar */}
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-brand-gold"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="whitespace-nowrap font-body text-body-xs text-muted">
                {answeredQuestions} / {totalQuestions}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-5 lg:px-7 lg:py-5">
            <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:items-stretch">
              {/* Left column — Hero card */}
              <div className="lg:flex lg:flex-col">
                <div className="relative flex flex-col overflow-visible rounded-card border-[1.5px] border-brand-sage bg-brand-accent p-4 lg:h-full">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-card"
                  >
                    <Rycina
                      id={SESSION_MODE_RYCINA.inteligentnaPlate}
                      mask="fade-y"
                      fit="cover"
                      className="inset-0 opacity-[0.16]"
                    />
                  </div>
                  <span className="absolute -top-2 right-3 z-10 rounded-pill bg-brand-gold px-2.5 py-0.5 font-body text-[10px] font-semibold text-brand-bg">
                    {t("recommended")}
                  </span>

                  <div className="relative z-[1] mb-2.5 flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-sage/25">
                    <Lightbulb className="size-5 text-success" aria-hidden />
                  </div>

                  <h3 className="font-heading text-heading-sm text-primary">
                    {t("smartSession")}
                  </h3>
                  <p className="mt-1 font-body text-body-sm text-secondary">
                    {t("smartSessionTopicDesc")}
                  </p>

                  {/* Count pills for Inteligentna */}
                  <CountPills
                    preset={smartPreset}
                    custom={smartCustom}
                    totalQuestions={poolTotal}
                    onPresetChange={setSmartPreset}
                    onCustomChange={setSmartCustom}
                    className="mt-3.5 border-t border-white/[0.06] pt-3"
                    questionsShort={questionsShort}
                    allQuestionsAriaLabel={allQuestionsAriaLabel}
                  />
                  {thinCem && fillOwn ? (
                    <p className="mt-2 font-body text-[11px] text-muted">
                      {tFilter("sessionMix", {
                        cem: smartMix.cem,
                        own: smartMix.own,
                      })}
                    </p>
                  ) : null}

                  {/* CTA — lg:mt-auto pushes to bottom only on desktop */}
                  {canStart ? (
                    <Link
                      href={smartHref}
                      className="mt-3.5 block w-full rounded-btn bg-brand-sage py-2.5 text-center font-body text-body-sm font-semibold text-white transition duration-200 ease-out hover:bg-[#4a9085] lg:mt-auto lg:pt-3.5"
                    >
                      {t("startSession")}
                    </Link>
                  ) : (
                    <span className="mt-3.5 block w-full cursor-not-allowed rounded-btn bg-brand-sage/40 py-2.5 text-center font-body text-body-sm font-semibold text-white/70 lg:mt-auto lg:pt-3.5">
                      {t("noQuestionsForFilter")}
                    </span>
                  )}
                </div>
              </div>

              {/* Right column (desktop) / below hero (mobile) */}
              <div className="mt-5 flex flex-col gap-4 lg:mt-0">
                {/* Section label */}
                <p className="mb-0 font-body text-body-xs uppercase tracking-normal text-muted">
                  {t("otherModes")}
                </p>

                {hasKnowledgeCard ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
                      <div className={altCardClass}>
                        <ModeWatermark id={SESSION_MODE_RYCINA.przegladEmblem} />
                        <div className="relative z-[1] mb-2 flex h-7 w-7 items-center justify-center rounded-btn bg-white/[0.04]">
                          <FileText className="size-4 text-muted" aria-hidden />
                        </div>
                        <h4 className="font-heading text-body-md font-bold text-primary">
                          {t("classicLearning")}
                        </h4>
                        <p className="mt-1 font-body text-[11px] leading-snug text-muted">
                          {t("classicLearningDesc")}
                        </p>
                        <CountPills
                          preset={reviewPreset}
                          custom={reviewCustom}
                          totalQuestions={poolTotal}
                          onPresetChange={setReviewPreset}
                          onCustomChange={setReviewCustom}
                          className="mt-2.5 border-t border-white/[0.06] pt-2.5"
                          compact
                          questionsShort={questionsShort}
                          allQuestionsAriaLabel={allQuestionsAriaLabel}
                        />
                        {thinCem && fillOwn ? (
                          <p className="mt-2 font-body text-[11px] text-muted">
                            {tFilter("sessionMix", {
                              cem: reviewMix.cem,
                              own: reviewMix.own,
                            })}
                          </p>
                        ) : null}
                        <Link
                          href={reviewHref}
                          className={cn(
                            "mt-2.5 inline-flex w-fit items-center rounded-btn border px-3 py-1.5 font-body text-body-xs font-medium transition-colors",
                            canStart
                              ? "border-brand-sage/40 text-brand-sage hover:bg-brand-sage/10"
                              : "pointer-events-none cursor-not-allowed border-border text-muted",
                          )}
                          aria-disabled={!canStart}
                        >
                          {canStart ? t("start") : t("noQuestionsForFilter")}
                        </Link>
                      </div>

                      <Link href={catalogHref} className={altCardClass}>
                        <ModeWatermark id={SESSION_MODE_RYCINA.katalogEmblem} />
                        <div className="relative z-[1] mb-2 flex h-7 w-7 items-center justify-center rounded-btn bg-white/[0.04]">
                          <LayoutGrid className="size-4 text-muted" aria-hidden />
                        </div>
                        <h4 className="font-heading text-body-md font-bold text-primary">
                          {t("questionCatalog")}
                        </h4>
                        <p className="mt-1 font-body text-[11px] leading-snug text-muted">
                          {t("catalogBrowseShort")}
                        </p>
                        <span className="mt-auto pt-2.5 font-body text-body-xs font-medium text-brand-sage">
                          {t("browse")}
                        </span>
                      </Link>
                    </div>

                    {/* Knowledge card bar */}
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        onOpenKnowledgeCard?.();
                      }}
                      className="mt-auto flex items-center gap-2.5 rounded-[10px] border border-brand-gold/15 bg-brand-gold/[0.06] px-3.5 py-3 transition-colors hover:border-brand-gold/30"
                    >
                      <BookOpen
                        className="size-[18px] shrink-0 text-brand-gold"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <h5 className="font-body text-body-sm font-medium text-primary">
                          {t("knowledgeCard")}
                        </h5>
                        <span className="font-body text-[11px] text-muted">
                          {t("knowledgeCardTheory")}
                        </span>
                      </div>
                      <ChevronRight
                        className="size-4 shrink-0 text-brand-gold"
                        aria-hidden
                      />
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:flex lg:flex-1 lg:flex-col">
                    <div className={cn(altCardClass, "lg:flex-1")}>
                      <ModeWatermark id={SESSION_MODE_RYCINA.przegladEmblem} />
                      <div className="relative z-[1] mb-2 flex h-7 w-7 items-center justify-center rounded-btn bg-white/[0.04]">
                        <FileText className="size-4 text-muted" aria-hidden />
                      </div>
                      <h4 className="font-heading text-body-md font-bold text-primary">
                        {t("classicLearning")}
                      </h4>
                      <p className="mt-1 font-body text-[11px] leading-snug text-muted">
                        {t("classicLearningDesc")}
                      </p>
                      <CountPills
                        preset={reviewPreset}
                        custom={reviewCustom}
                        totalQuestions={poolTotal}
                        onPresetChange={setReviewPreset}
                        onCustomChange={setReviewCustom}
                        className="mt-2.5 border-t border-white/[0.06] pt-2.5"
                        compact
                        questionsShort={questionsShort}
                        allQuestionsAriaLabel={allQuestionsAriaLabel}
                      />
                      {thinCem && fillOwn ? (
                        <p className="mt-2 font-body text-[11px] text-muted">
                          {tFilter("sessionMix", {
                            cem: reviewMix.cem,
                            own: reviewMix.own,
                          })}
                        </p>
                      ) : null}
                      <Link
                        href={reviewHref}
                        className={cn(
                          "mt-2.5 inline-flex w-fit items-center rounded-btn border px-3 py-1.5 font-body text-body-xs font-medium transition-colors",
                          canStart
                            ? "border-brand-sage/40 text-brand-sage hover:bg-brand-sage/10"
                            : "pointer-events-none cursor-not-allowed border-border text-muted",
                        )}
                        aria-disabled={!canStart}
                      >
                        {canStart ? t("start") : t("noQuestionsForFilter")}
                      </Link>
                    </div>

                    <Link href={catalogHref} className={cn(altCardClass, "lg:flex-1")}>
                      <ModeWatermark id={SESSION_MODE_RYCINA.katalogEmblem} />
                      <div className="relative z-[1] mb-2 flex h-7 w-7 items-center justify-center rounded-btn bg-white/[0.04]">
                        <LayoutGrid className="size-4 text-muted" aria-hidden />
                      </div>
                      <h4 className="font-heading text-body-md font-bold text-primary">
                        {t("questionCatalog")}
                      </h4>
                      <p className="mt-1 font-body text-[11px] leading-snug text-muted">
                        {t("catalogBrowseShort")}
                      </p>
                      <span className="mt-auto pt-2.5 font-body text-body-xs font-medium text-brand-sage">
                        {t("browse")}
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type CountPillsProps = {
  preset: PresetValue;
  custom: string;
  totalQuestions: number;
  onPresetChange: (p: PresetValue) => void;
  onCustomChange: (v: string) => void;
  className?: string;
  compact?: boolean;
  questionsShort: string;
  allQuestionsAriaLabel: string;
};

function ModeWatermark({ id }: { id: string }) {
  return (
    <span className="pointer-events-none absolute -right-1 -top-2 text-brand-sage">
      <RycinaEmblem id={id} size={72} className="opacity-[0.18]" />
    </span>
  );
}

function CountPills({
  preset,
  custom,
  totalQuestions,
  onPresetChange,
  onCustomChange,
  className,
  compact = false,
  questionsShort,
  allQuestionsAriaLabel,
}: CountPillsProps) {
  const sizeClass = compact
    ? "h-6 min-w-[32px] px-1.5 text-[12px]"
    : "h-7 min-w-[36px] px-1.5 text-body-sm";
  const inputSizeClass = compact ? "h-6 w-[44px] text-[12px]" : "h-7 w-[52px] text-body-sm";

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {PRESETS.map((n) => {
        const unavailable = n > totalQuestions;
        return (
          <button
            key={n}
            type="button"
            disabled={unavailable}
            onClick={() => {
              if (unavailable) return;
              onPresetChange(n);
              onCustomChange("");
            }}
            className={cn(
              "flex items-center justify-center rounded-pill border font-body transition-colors",
              sizeClass,
              unavailable
                ? "cursor-not-allowed border-border/60 text-muted line-through opacity-40"
                : "cursor-pointer",
              !unavailable && preset === n
                ? "border-brand-sage bg-brand-sage font-semibold text-white"
                : !unavailable
                  ? "border-border bg-transparent text-secondary"
                  : null,
            )}
          >
            {n}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => {
          onPresetChange("all");
          onCustomChange("");
        }}
        className={cn(
          "flex cursor-pointer items-center justify-center rounded-pill border transition-colors",
          sizeClass,
          preset === "all"
            ? "border-brand-sage bg-brand-sage text-white"
            : "border-border bg-transparent text-secondary",
        )}
        aria-label={allQuestionsAriaLabel}
      >
        <InfinityIcon className={compact ? "size-3.5" : "size-4"} aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={totalQuestions}
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
          "rounded-pill border border-border bg-white/[0.03] text-center font-body text-primary outline-none placeholder:text-muted focus:border-brand-sage",
          inputSizeClass,
        )}
      />
      <span className="ml-auto font-body text-body-xs text-muted">{questionsShort}</span>
    </div>
  );
}
