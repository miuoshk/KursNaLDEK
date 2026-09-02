"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Infinity as InfinityIcon } from "lucide-react";
import {
  SESSION_COUNT_PRESETS,
  getSessionCountLabels,
  resolveSessionPickerCount,
  sessionCountToPickerState,
} from "@/features/session/lib/sessionCount";
import { cn } from "@/lib/utils";

import type { SourceFilter } from "@/features/session/types";
import type { SourceFilterCounts } from "@/features/session/lib/sourceFilter";
import {
  isThinCemPool,
  sessionMixCounts,
} from "@/features/session/lib/questionSourceBadge";
import { FEATURES } from "@/lib/featureFlags";
import { isSourceFilterLive } from "@/lib/products";
import { Toggle } from "@/features/shared/components/Toggle";
import { Rycina } from "@/features/shared/components/Rycina";
import {
  SESSION_MODE_RYCINA,
  subjectRycina,
} from "@/features/shared/lib/rycinaCatalog";
import type { DailyStudyPlan } from "@/features/session/lib/dailyPlan";

const PRESETS = SESSION_COUNT_PRESETS;
type PresetValue = (typeof PRESETS)[number] | "all" | null;

type SmartSessionCTAProps = {
  subjectId: string;
  availableQuestionCount: number;
  initialSessionCount: number;
  dueCount?: number;
  product?: string;
  source?: SourceFilter;
  sourceCounts?: SourceFilterCounts | null;
  dailyPlan?: DailyStudyPlan | null;
};

export function SmartSessionCTA({
  subjectId,
  availableQuestionCount,
  initialSessionCount,
  dueCount = 0,
  product,
  source,
  sourceCounts = null,
  dailyPlan = null,
}: SmartSessionCTAProps) {
  const t = useTranslations("subjects");
  const tSession = useTranslations("session");
  const tFilter = useTranslations("sourceFilter");
  const { questionsShort, allQuestionsAriaLabel } =
    getSessionCountLabels(tSession);
  const sourceLive =
    Boolean(product) && FEATURES.cemSource && isSourceFilterLive(product);
  const planEnabled = dailyPlan?.experimentVariant === "treatment";
  const cemCount = sourceCounts?.reference ?? 0;
  const ownCount = sourceCounts?.own ?? 0;
  const thinCem =
    sourceLive && source === "reference" && isThinCemPool(cemCount);
  const [fillOwn, setFillOwn] = useState(true);
  const fillActive = thinCem && fillOwn;
  const poolTotal = fillActive ? cemCount + ownCount : availableQuestionCount;
  const canStart = poolTotal > 0;
  const maxQ = Math.max(1, poolTotal);
  const smartInitial = sessionCountToPickerState(
    Math.min(initialSessionCount, maxQ),
  );
  const reviewInitial = sessionCountToPickerState(
    Math.min(initialSessionCount, maxQ),
  );

  const [smartPreset, setSmartPreset] = useState<PresetValue>(
    smartInitial.preset,
  );
  const [smartCustom, setSmartCustom] = useState(smartInitial.custom);
  const [reviewPreset, setReviewPreset] = useState<PresetValue>(
    reviewInitial.preset,
  );
  const [reviewCustom, setReviewCustom] = useState(reviewInitial.custom);

  const visibleSmartPreset =
    typeof smartPreset === "number" && smartPreset > poolTotal
      ? "all"
      : smartPreset;
  const visibleReviewPreset =
    typeof reviewPreset === "number" && reviewPreset > poolTotal
      ? "all"
      : reviewPreset;

  const smartCount = resolveSessionPickerCount(
    visibleSmartPreset,
    visibleSmartPreset === "all" ? "" : smartCustom,
    maxQ,
    Math.min(initialSessionCount, maxQ),
  );
  const reviewCount = resolveSessionPickerCount(
    visibleReviewPreset,
    visibleReviewPreset === "all" ? "" : reviewCustom,
    maxQ,
    Math.min(initialSessionCount, maxQ),
  );

  const srcParam =
    product &&
    source &&
    source !== "all" &&
    FEATURES.cemSource &&
    isSourceFilterLive(product)
      ? source
      : undefined;

  const smartHref = useMemo(() => {
    const q = new URLSearchParams({
      subject: subjectId,
      mode: "inteligentna",
      count: String(smartCount),
    });
    if (srcParam) q.set("src", srcParam);
    if (fillActive) q.set("fillown", "1");
    return `/sesja/new?${q.toString()}`;
  }, [subjectId, smartCount, srcParam, fillActive]);

  const planHref = useMemo(() => {
    if (!planEnabled) return null;
    const count = Math.min(
      maxQ,
      Math.max(0, dailyPlan?.questionCount ?? smartCount),
    );
    if (count === 0) return null;
    const q = new URLSearchParams({
      subject: subjectId,
      mode: "inteligentna",
      count: String(count),
      plan: "1",
    });
    if (srcParam) q.set("src", srcParam);
    if (fillActive) q.set("fillown", "1");
    return `/sesja/new?${q.toString()}`;
  }, [
    dailyPlan?.questionCount,
    fillActive,
    maxQ,
    smartCount,
    srcParam,
    subjectId,
    planEnabled,
  ]);

  const reviewHref = useMemo(() => {
    const q = new URLSearchParams({
      subject: subjectId,
      mode: "przeglad",
      count: String(reviewCount),
    });
    if (srcParam) q.set("src", srcParam);
    if (fillActive) q.set("fillown", "1");
    return `/sesja/new?${q.toString()}`;
  }, [subjectId, reviewCount, srcParam, fillActive]);

  const dueReviewHref = useMemo(() => {
    const q = new URLSearchParams({
      subject: subjectId,
      mode: "inteligentna",
      count: String(Math.max(1, Math.min(smartCount, dueCount))),
      focus: "due",
    });
    if (srcParam) q.set("src", srcParam);
    return `/sesja/new?${q.toString()}`;
  }, [subjectId, dueCount, smartCount, srcParam]);

  const catalogHref = useMemo(() => {
    const q = new URLSearchParams({
      subject: subjectId,
      mode: "katalog",
      count: "5000",
    });
    if (srcParam) q.set("src", srcParam);
    return `/sesja/new?${q.toString()}`;
  }, [subjectId, srcParam]);

  const plate =
    subjectRycina(subjectId)?.plate ?? SESSION_MODE_RYCINA.inteligentnaPlate;

  const smartMix = sessionMixCounts(smartCount, cemCount, ownCount, fillActive);
  const reviewMix = sessionMixCounts(
    reviewCount,
    cemCount,
    ownCount,
    fillActive,
  );

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-xl font-bold text-primary">
        {t("startLearning")}
      </h2>

      <div className="relative overflow-hidden rounded-card border border-brand-sage/20 bg-card p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-card"
        >
          <Rycina
            id={plate}
            mask="edge-right"
            fit="cover"
            className="inset-0 opacity-[0.14]"
          />
        </div>
        <div className="relative z-[1]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-heading-sm text-primary">
              {planEnabled ? t("planToday") : t("smartSession")}
            </h3>
            <p className="mt-2 font-body text-body-sm text-secondary">
              {planEnabled && dailyPlan
                ? t("planTodayDesc", {
                    minutes: dailyPlan.estimatedMinutes,
                    due: dailyPlan.dueCount,
                    fresh: dailyPlan.newCount,
                    remediation: dailyPlan.remediationCount,
                  })
                : t("smartSessionDesc")}
            </p>
          </div>
          {canStart && planEnabled && planHref ? (
            <Link
              href={planHref}
              className="inline-flex w-full shrink-0 items-center justify-center rounded-lg bg-brand-sage px-6 py-3 font-body font-semibold text-white transition duration-200 ease-out hover:bg-[#4a9085] hover:shadow-[0_0_16px_rgba(54,115,104,0.4)] sm:w-auto"
            >
              {t("doPlanToday")}
            </Link>
          ) : canStart && planEnabled && dailyPlan?.questionCount === 0 ? (
            <span className="inline-flex w-full shrink-0 items-center justify-center rounded-lg border border-success/25 bg-success/[0.08] px-6 py-3 font-body font-semibold text-success sm:w-auto">
              {t("planComplete")}
            </span>
          ) : canStart ? (
            <Link
              href={smartHref}
              className="inline-flex w-full shrink-0 items-center justify-center rounded-lg bg-brand-sage px-6 py-3 font-body font-semibold text-white transition duration-200 ease-out hover:bg-[#4a9085] hover:shadow-[0_0_16px_rgba(54,115,104,0.4)] sm:w-auto"
            >
              {t("startSession")}
            </Link>
          ) : (
            <span className="inline-flex w-full shrink-0 cursor-not-allowed items-center justify-center rounded-lg bg-brand-sage/40 px-6 py-3 font-body font-semibold text-white/70 sm:w-auto">
              {t("noQuestionsForFilter")}
            </span>
          )}
        </div>

        {thinCem ? (
          <div className="mt-4 rounded-[10px] border border-brand-gold/25 bg-brand-gold/[0.07] px-3.5 py-3">
            <p className="font-body text-body-sm text-primary">
              {tFilter("thinCemBar", { count: cemCount })}
            </p>
            <div className="mt-2.5 flex items-center justify-between gap-3">
              <p
                id="cta-fill-own-label"
                className="font-body text-body-xs text-secondary"
              >
                {tFilter("fillWithOwn")}
              </p>
              <Toggle
                checked={fillOwn}
                onCheckedChange={setFillOwn}
                aria-labelledby="cta-fill-own-label"
              />
            </div>
          </div>
        ) : null}

        {dueCount > 0 ? (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-brand-gold/20 bg-brand-gold/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-body text-body-sm font-medium text-primary">
                {t("scheduledReviews")}
              </p>
              <p className="mt-0.5 font-body text-body-xs text-secondary">
                {dueCount}{" "}
                {dueCount === 1
                  ? t("dueWaitingOne")
                  : dueCount < 5
                    ? t("dueWaitingFew")
                    : t("dueWaitingMany")}{" "}
                {t("dueReviewsOnly")}
              </p>
            </div>
            {planEnabled ? (
              <span className="font-body text-body-xs font-medium text-brand-gold">
                {t("dueIncludedInPlan")}
              </span>
            ) : (
              <Link
                href={dueReviewHref}
                className="inline-flex w-full shrink-0 items-center justify-center rounded-lg bg-brand-gold px-5 py-2.5 font-body text-body-sm font-semibold text-background transition duration-200 ease-out hover:brightness-110 sm:w-auto"
              >
                {t("reviewButton", {
                  count: Math.min(smartCount, dueCount),
                })}
              </Link>
            )}
          </div>
        ) : null}

        <div className="mt-6 border-t border-border pt-4">
          <p className="font-body text-body-xs uppercase tracking-normal text-muted">
            {planEnabled ? t("manualQuestionCount") : t("questionCount")}
          </p>
          <PresetPicker
            preset={visibleSmartPreset}
            custom={visibleSmartPreset === "all" ? "" : smartCustom}
            maxQ={maxQ}
            onPresetChange={setSmartPreset}
            onCustomChange={setSmartCustom}
            questionsShort={questionsShort}
            allQuestionsAriaLabel={allQuestionsAriaLabel}
          />
          {thinCem && fillOwn ? (
            <p className="mt-2 font-body text-body-xs text-muted">
              {tFilter("sessionMix", { cem: smartMix.cem, own: smartMix.own })}
            </p>
          ) : (
            <p className="mt-2 font-body text-body-xs text-muted">
              {t("availableQuestions", { count: poolTotal })}
            </p>
          )}
          {canStart && planEnabled ? (
            <Link
              href={smartHref}
              className="mt-3 inline-flex items-center rounded-lg border border-brand-sage/40 px-4 py-2 font-body text-body-sm font-medium text-brand-sage transition-colors duration-200 hover:bg-brand-sage/10"
            >
              {t("startManualSession")}
            </Link>
          ) : null}
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
        <div className="flex flex-col rounded-card border border-border bg-card p-5">
          <h3 className="font-heading text-heading-sm text-primary">
            {t("classicLearning")}
          </h3>
          <p className="mt-1 font-body text-body-sm text-secondary">
            {t("classicLearningDesc")}
          </p>

          <div className="mt-4 border-t border-border pt-3">
            <p className="font-body text-body-xs uppercase tracking-normal text-muted">
              {t("questionCount")}
            </p>
            <PresetPicker
              preset={visibleReviewPreset}
              custom={visibleReviewPreset === "all" ? "" : reviewCustom}
              maxQ={maxQ}
              onPresetChange={setReviewPreset}
              onCustomChange={setReviewCustom}
              compact
              questionsShort={questionsShort}
              allQuestionsAriaLabel={allQuestionsAriaLabel}
            />
          </div>
          {thinCem && fillOwn ? (
            <p className="mt-2 font-body text-body-xs text-muted">
              {tFilter("sessionMix", {
                cem: reviewMix.cem,
                own: reviewMix.own,
              })}
            </p>
          ) : null}

          {canStart ? (
            <Link
              href={reviewHref}
              className="mt-4 inline-flex items-center self-start rounded-lg bg-brand-sage px-4 py-2 font-body text-body-sm font-medium text-white transition duration-200 ease-out hover:bg-[#4a9085] hover:shadow-[0_0_12px_rgba(54,115,104,0.35)]"
            >
              {t("start")}
            </Link>
          ) : (
            <span className="mt-4 inline-flex cursor-not-allowed items-center self-start rounded-lg bg-brand-sage/40 px-4 py-2 font-body text-body-sm font-medium text-white/70">
              {t("noQuestionsForFilter")}
            </span>
          )}
        </div>

        <div className="flex flex-col rounded-card border border-border bg-card p-5">
          <h3 className="font-heading text-heading-sm text-primary">
            {t("questionCatalog")}
          </h3>
          <p className="mt-1 font-body text-body-sm text-secondary">
            {t("questionCatalogDesc")}
          </p>
          <Link
            href={catalogHref}
            className="mt-4 inline-flex items-center self-start rounded-lg border border-brand-sage/40 px-4 py-2 font-body text-body-sm font-medium text-brand-sage transition-colors duration-200 hover:bg-brand-sage/10"
          >
            {t("browse")}
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
  questionsShort: string;
  allQuestionsAriaLabel: string;
};

function PresetPicker({
  preset,
  custom,
  maxQ,
  onPresetChange,
  onCustomChange,
  compact = false,
  questionsShort,
  allQuestionsAriaLabel,
}: PresetPickerProps) {
  const pillClass = compact
    ? "flex h-7 min-w-[36px] items-center justify-center rounded-pill border px-1.5 font-body text-body-sm transition-colors"
    : "flex h-8 min-w-[40px] items-center justify-center rounded-pill border px-2 font-body text-body-sm transition-colors";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {PRESETS.map((n) => {
        const unavailable = n > maxQ;
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
              pillClass,
              unavailable
                ? "cursor-not-allowed border-border/60 text-muted line-through opacity-40"
                : "cursor-pointer",
              !unavailable && preset === n
                ? "border-brand-sage bg-brand-sage font-semibold text-white"
                : !unavailable
                  ? "border-border bg-transparent text-secondary hover:text-primary"
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
          pillClass,
          "cursor-pointer",
          preset === "all"
            ? "border-brand-sage bg-brand-sage text-white"
            : "border-border bg-transparent text-secondary hover:text-primary",
        )}
        aria-label={allQuestionsAriaLabel}
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
      <span className="ml-auto font-body text-body-xs text-muted">
        {questionsShort}
      </span>
    </div>
  );
}
