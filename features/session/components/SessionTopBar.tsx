"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { SessionMode } from "@/features/session/types";

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  onEnd,
}: SessionTopBarProps) {
  const t = useTranslations("session");
  const pct = total > 0 ? Math.min(100, ((current + 1) / total) * 100) : 0;
  const topicsLine =
    sessionTopicNames && sessionTopicNames.length > 0
      ? sessionTopicNames.join(" · ")
      : null;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background px-4 py-3 sm:px-6">
      {selectedTopicName ? (
        <p className="mb-2 font-body text-body-sm font-medium text-brand-gold">
          {t("topicLabel", { name: selectedTopicName })}
        </p>
      ) : null}
      {topicsLine && !selectedTopicName ? (
        <p className="mb-2 line-clamp-2 font-body text-body-xs text-muted" title={topicsLine}>
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
              className="h-full rounded-full bg-brand-gold transition-[width] duration-[400ms] ease-out"
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
            "ml-auto inline-flex shrink-0 items-center gap-1 font-body text-body-sm text-muted transition-colors duration-200 ease-out",
            "hover:text-error",
          )}
        >
          {t("endSession")}
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </header>
  );
}
