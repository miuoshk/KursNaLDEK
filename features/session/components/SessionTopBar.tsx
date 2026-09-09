"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { SessionProgressSquares } from "@/features/session/components/SessionProgressSquares";
import { useNarrowViewport } from "@/features/shared/hooks/useNarrowViewport";
import { useSidebarStore } from "@/features/shared/stores/sidebarStore";
import type { SessionAnswer, SessionMode, SessionQuestion } from "@/features/session/types";
import { cn } from "@/lib/utils";

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SessionProgressMenu({
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
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mapId = useId();
  const canExpand = Boolean(questions?.length && answeredMap);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const currentTile = panelRef.current?.querySelector<HTMLElement>(
      "[aria-current='true']",
    );
    currentTile?.focus();
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-btn px-2 font-body text-body-sm tabular-nums text-secondary"
        aria-expanded={canExpand ? open : undefined}
        aria-haspopup={canExpand ? "dialog" : undefined}
        aria-controls={canExpand ? mapId : undefined}
        aria-label={t("questionProgress", { current: current + 1, total })}
        onClick={() => {
          if (canExpand) setOpen((prev) => !prev);
        }}
      >
        {t("progressCollapsed", { current: current + 1, total })}
      </button>
      {canExpand && open ? (
        <div
          ref={panelRef}
          id={mapId}
          role="dialog"
          aria-label={t("progressMapAria")}
          className="absolute right-0 top-full z-40 mt-1 w-[min(100vw-1.5rem,24rem)] rounded-card border border-border bg-card p-2 shadow-lg"
        >
          <SessionProgressSquares
            questions={questions!}
            answeredMap={answeredMap!}
            currentIndex={current}
            onJumpTo={(idx) => {
              onJumpTo?.(idx);
              setOpen(false);
              triggerRef.current?.focus();
            }}
          />
          <button
            type="button"
            className="mt-1 inline-flex min-h-11 w-full items-center justify-center rounded-btn font-body text-body-xs text-secondary hover:text-primary"
            onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
          >
            {tCommon("close")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SessionTopicName({
  title,
  titleFull,
}: {
  title: string;
  titleFull: string;
}) {
  const t = useTranslations("session");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div className="relative min-w-0 flex-1 max-[15rem]:order-last max-[15rem]:basis-full">
      <button
        ref={triggerRef}
        type="button"
        className="flex min-h-11 w-full min-w-0 items-center rounded-btn px-1 text-left"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-label={t("topicNameExpandAria", { name: titleFull })}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="block min-w-0 truncate font-body text-body-sm font-medium text-secondary">
          {title}
        </span>
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={dialogId}
          role="dialog"
          aria-label={t("topicNameDialogAria")}
          className="absolute left-0 top-full z-40 mt-1 w-[min(100vw-1.5rem,24rem)] rounded-card border border-border bg-card p-3 shadow-lg"
        >
          <p className="font-body text-[16px] leading-[1.6] text-primary">{titleFull}</p>
          <button
            type="button"
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-btn font-body text-body-xs text-secondary hover:text-primary"
            onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
          >
            {tCommon("close")}
          </button>
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
  const tCommon = useTranslations("common");
  const narrow = useNarrowViewport();
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const pct = total > 0 ? Math.min(100, ((current + 1) / total) * 100) : 0;
  const topicsLine =
    sessionTopicNames && sessionTopicNames.length > 0
      ? sessionTopicNames.join(" · ")
      : null;
  const title = selectedTopicName ?? subjectName;
  const titleFull =
    selectedTopicName && topicsLine && !topicsLine.includes(selectedTopicName)
      ? `${selectedTopicName} · ${topicsLine}`
      : (topicsLine ?? title);

  return (
    <header
      data-session-topbar
      className="sticky top-0 z-30 border-b border-border bg-background px-2 py-1 sm:px-4"
    >
      <div className="flex flex-wrap items-center gap-1">
        {narrow ? (
          <button
            type="button"
            data-nav-menu-trigger
            onClick={() => setMobileOpen(true)}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-btn text-secondary transition-colors hover:bg-white/[0.04] hover:text-primary"
            aria-label={tCommon("openMenu")}
          >
            <Menu className="size-5" aria-hidden />
          </button>
        ) : null}
        <SessionTopicName title={title} titleFull={titleFull} />
        {examElapsedSeconds !== null ? (
          <p
            className="hidden shrink-0 font-body text-body-sm tabular-nums text-primary min-[15rem]:block"
            aria-label={t("sessionTimeAria")}
          >
            {formatClock(examElapsedSeconds)}
          </p>
        ) : null}
        <SessionProgressMenu
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
      <div
        className="mt-1 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.08]"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-white/30 motion-reduce:transition-none transition-[width] duration-[400ms] ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </header>
  );
}
