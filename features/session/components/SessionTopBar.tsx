"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { SessionProgressSquares } from "@/features/session/components/SessionProgressSquares";
import type { SessionAnswer, SessionMode, SessionQuestion } from "@/features/session/types";
import { cn } from "@/lib/utils";

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SessionMobileProgress({
  current,
  total,
  questions,
  answeredMap,
  onJumpTo,
}: {
  current: number;
  total: number;
  questions?: SessionQuestion[];
  answeredMap?: Record<string, SessionAnswer>;
  onJumpTo?: (idx: number) => void;
}) {
  const t = useTranslations("session");
  const [open, setOpen] = useState(false);
  const canExpand = Boolean(questions?.length && answeredMap);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-btn px-2 font-body text-body-sm tabular-nums text-secondary"
        aria-expanded={canExpand ? open : undefined}
        aria-controls={canExpand ? "session-mobile-progress-map" : undefined}
        onClick={() => {
          if (canExpand) setOpen((prev) => !prev);
        }}
      >
        {t("progressCollapsed", { current: current + 1, total })}
      </button>
      {canExpand && open ? (
        <div
          id="session-mobile-progress-map"
          className="absolute right-0 top-full z-40 mt-1 w-[min(100vw-1.5rem,24rem)] rounded-card border border-border bg-card p-2 shadow-lg"
        >
          <SessionProgressSquares
            questions={questions!}
            answeredMap={answeredMap!}
            currentIndex={current}
            onJumpTo={(idx) => {
              onJumpTo?.(idx);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

type SessionTopBarProps = {
  subjectName: string;
  current: number;
  total: number;
  /** Nieużywane w UI; zostawione dla zgodności z rodzajem sesji. */
  mode: SessionMode;
  examElapsedSeconds: number | null;
  /** Wybrany temat sesji (z kafelka / URL) — zawsze widoczny. */
  selectedTopicName?: string;
  /** Unikalne nazwy tematów w bieżącej sesji (gdy włączone w ustawieniach). */
  sessionTopicNames?: string[];
  questions?: SessionQuestion[];
  answeredMap?: Record<string, SessionAnswer>;
  onJumpTo?: (idx: number) => void;
  onEnd: () => void;
};

export function SessionTopBar({
  subjectName,
  current,
  total,
  mode: _mode,
  examElapsedSeconds,
  selectedTopicName,
  sessionTopicNames,
  questions,
  answeredMap,
  onJumpTo,
  onEnd,
}: SessionTopBarProps) {
  const t = useTranslations("session");
  const pct = total > 0 ? Math.min(100, ((current + 1) / total) * 100) : 0;
  const topicsLine =
    sessionTopicNames && sessionTopicNames.length > 0
      ? sessionTopicNames.join(" · ")
      : null;
  const mobileTitle = selectedTopicName ?? subjectName;

  return (
    <header
      data-session-topbar
      className="sticky top-0 z-30 border-b border-border bg-background px-3 py-2 sm:px-6 sm:py-3"
    >
      <div className="flex items-center gap-2 sm:hidden">
        <p
          className="min-w-0 flex-1 truncate font-body text-body-sm font-medium text-secondary"
          title={mobileTitle}
        >
          {mobileTitle}
        </p>
        {examElapsedSeconds !== null ? (
          <p
            className="shrink-0 font-body text-body-sm tabular-nums text-primary"
            aria-label={t("sessionTimeAria")}
          >
            {formatClock(examElapsedSeconds)}
          </p>
        ) : null}
        <SessionMobileProgress
          current={current}
          total={total}
          questions={questions}
          answeredMap={answeredMap}
          onJumpTo={onJumpTo}
        />
        <button
          type="button"
          onClick={onEnd}
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-btn text-secondary transition-colors duration-200 ease-out",
            "hover:text-error",
          )}
          aria-label={t("endSession")}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="hidden sm:block">
        {selectedTopicName ? (
          <p className="mb-2 font-body text-body-sm font-medium text-secondary">
            {t("topicLabel", { name: selectedTopicName })}
          </p>
        ) : null}
        {topicsLine && !selectedTopicName ? (
          <p
            className="mb-2 line-clamp-2 font-body text-body-xs text-muted"
            title={topicsLine}
          >
            {t("topicsLabel", { names: topicsLine })}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-4">
          <span className="shrink-0 rounded-pill bg-card px-4 py-1.5 font-body text-body-sm font-medium text-primary">
            {subjectName}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-body text-body-sm tabular-nums text-secondary">
              {t("questionProgress", { current: current + 1, total })}
            </p>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-white/30 transition-[width] duration-[400ms] ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {examElapsedSeconds !== null ? (
            <p
              className="min-w-[4.5ch] shrink-0 text-right font-body text-body-md tabular-nums text-primary"
              aria-label={t("sessionTimeAria")}
            >
              {formatClock(examElapsedSeconds)}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onEnd}
            className={cn(
              "ml-auto inline-flex min-h-11 shrink-0 items-center gap-1 px-2 font-body text-body-sm text-secondary transition-colors duration-200 ease-out",
              "hover:text-error",
            )}
          >
            {t("endSession")}
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
