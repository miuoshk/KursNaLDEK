"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Infinity as InfinityIcon,
  LayoutGrid,
  Lightbulb,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TopicSessionConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectShortName: string;
  topicId: string;
  topicName: string;
  totalQuestions: number;
  answeredQuestions: number;
  hasKnowledgeCard?: boolean;
  onOpenKnowledgeCard?: () => void;
};

const PRESETS = [10, 25, 50] as const;
type PresetValue = (typeof PRESETS)[number] | "all" | null;

function buildHref(
  subjectId: string,
  topicId: string,
  mode: string,
  count: number,
) {
  const q = new URLSearchParams({
    subject: subjectId,
    topic: topicId,
    mode,
    count: String(count),
  });
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
  hasKnowledgeCard = false,
  onOpenKnowledgeCard,
}: TopicSessionConfigDialogProps) {
  const [preset, setPreset] = useState<PresetValue>(25);
  const [customCount, setCustomCount] = useState("");

  const progressPct =
    totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0;

  function getFinalCount() {
    if (preset === "all") return totalQuestions;
    const parsed = parseInt(customCount, 10);
    if (customCount && !Number.isNaN(parsed) && parsed >= 1 && parsed <= totalQuestions) {
      return parsed;
    }
    if (typeof preset === "number") return preset;
    return 25;
  }

  const finalCount = Math.min(getFinalCount(), Math.max(1, totalQuestions));

  const smartHref = buildHref(subjectId, topicId, "inteligentna", finalCount);
  const reviewHref = buildHref(subjectId, topicId, "przeglad", finalCount);
  const catalogHref = buildHref(subjectId, topicId, "katalog", 500);

  const altCardClass =
    "flex flex-col rounded-card border border-border bg-card-hover p-3.5 transition-colors hover:border-brand-sage/25";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 flex flex-col",
            "rounded-t-[20px] border border-b-0 border-border bg-card",
            "max-h-[92vh]",
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
            aria-label="Zamknij"
          >
            <X className="size-3.5" aria-hidden />
          </Dialog.Close>

          {/* Header */}
          <div className="px-5 pt-5 pb-0 lg:px-7 lg:pt-6">
            <Dialog.Title className="sr-only">{topicName}</Dialog.Title>
            <p className="font-body text-body-xs text-muted">
              {subjectShortName}
            </p>
            <p className="font-heading text-heading-sm text-primary lg:text-heading-md">
              Wybierz tryb nauki
            </p>

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
          <div className="px-5 py-4 lg:px-7 lg:py-5">
            <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:items-stretch">
              {/* Left column — Hero card */}
              <div className="lg:flex lg:flex-col">
                <div className="relative flex flex-col rounded-card border-[1.5px] border-brand-sage bg-brand-accent p-4 lg:h-full">
                  <span className="absolute -top-2 right-3 rounded-pill bg-brand-gold px-2.5 py-0.5 font-body text-[10px] font-semibold text-brand-bg">
                    Rekomendowane
                  </span>

                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-sage/25">
                    <Lightbulb className="size-5 text-success" aria-hidden />
                  </div>

                  <h3 className="font-body text-body-md font-semibold text-primary">
                    Inteligentna sesja
                  </h3>
                  <p className="mt-1 font-body text-body-sm text-secondary">
                    Algorytm dobierze pytania na podstawie Twojej wiedzy i
                    zaplanuje powtórki
                  </p>

                  {/* Count pills */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-3">
                    {PRESETS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setPreset(n);
                          setCustomCount("");
                        }}
                        className={cn(
                          "flex h-7 min-w-[36px] cursor-pointer items-center justify-center rounded-pill border px-1.5 font-body text-body-sm transition-colors",
                          preset === n
                            ? "border-brand-sage bg-brand-sage font-semibold text-white"
                            : "border-border bg-transparent text-secondary",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setPreset("all");
                        setCustomCount("");
                      }}
                      className={cn(
                        "flex h-7 min-w-[36px] cursor-pointer items-center justify-center rounded-pill border px-1.5 transition-colors",
                        preset === "all"
                          ? "border-brand-sage bg-brand-sage text-white"
                          : "border-border bg-transparent text-secondary",
                      )}
                    >
                      <InfinityIcon className="size-4" aria-hidden />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={totalQuestions}
                      placeholder="..."
                      value={customCount}
                      onChange={(e) => {
                        setCustomCount(e.target.value);
                        setPreset(null);
                      }}
                      onFocus={() => {
                        if (!customCount) setPreset(null);
                      }}
                      className="h-7 w-[52px] rounded-pill border border-border bg-white/[0.03] text-center font-body text-body-sm text-primary outline-none placeholder:text-muted focus:border-brand-sage"
                    />
                    <span className="ml-auto font-body text-body-xs text-muted">
                      pytań
                    </span>
                  </div>

                  {/* CTA — lg:mt-auto pushes to bottom only on desktop */}
                  <Link
                    href={smartHref}
                    className="mt-3.5 block w-full rounded-btn bg-brand-sage py-2.5 text-center font-body text-body-sm font-semibold text-white transition duration-200 ease-out hover:bg-[#4a9085] lg:mt-auto lg:pt-3.5"
                  >
                    Rozpocznij sesję
                  </Link>
                </div>
              </div>

              {/* Right column (desktop) / below hero (mobile) */}
              <div className="flex flex-col gap-3">
                {/* Section label */}
                <p className="mt-4 mb-0 font-body text-body-xs uppercase tracking-normal text-muted lg:mt-0">
                  Inne tryby
                </p>

                {hasKnowledgeCard ? (
                  <>
                    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1 lg:gap-3">
                      <Link href={reviewHref} className={altCardClass}>
                        <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-btn bg-white/[0.04]">
                          <FileText className="size-4 text-muted" aria-hidden />
                        </div>
                        <h4 className="font-body text-body-sm font-medium text-primary">
                          Nauka klasyczna
                        </h4>
                        <p className="mt-1 font-body text-[11px] leading-snug text-muted">
                          Pytania w losowej kolejności, bez algorytmu powtórek
                        </p>
                        <span className="mt-auto pt-2.5 font-body text-body-xs font-medium text-brand-sage">
                          Rozpocznij
                        </span>
                      </Link>

                      <Link href={catalogHref} className={altCardClass}>
                        <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-btn bg-white/[0.04]">
                          <LayoutGrid className="size-4 text-muted" aria-hidden />
                        </div>
                        <h4 className="font-body text-body-sm font-medium text-primary">
                          Katalog pytań
                        </h4>
                        <p className="mt-1 font-body text-[11px] leading-snug text-muted">
                          Przeglądaj pytania i wyjaśnienia
                        </p>
                        <span className="mt-auto pt-2.5 font-body text-body-xs font-medium text-brand-sage">
                          Przeglądaj
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
                          Karta wiedzy
                        </h5>
                        <span className="font-body text-[11px] text-muted">
                          Teoria i kluczowe pojęcia
                        </span>
                      </div>
                      <ChevronRight
                        className="size-4 shrink-0 text-brand-gold"
                        aria-hidden
                      />
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 lg:flex lg:flex-1 lg:flex-col lg:gap-3">
                    <Link href={reviewHref} className={cn(altCardClass, "lg:flex-1")}>
                      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-btn bg-white/[0.04]">
                        <FileText className="size-4 text-muted" aria-hidden />
                      </div>
                      <h4 className="font-body text-body-sm font-medium text-primary">
                        Nauka klasyczna
                      </h4>
                      <p className="mt-1 font-body text-[11px] leading-snug text-muted">
                        Pytania w losowej kolejności, bez algorytmu powtórek
                      </p>
                      <span className="mt-auto pt-2.5 font-body text-body-xs font-medium text-brand-sage">
                        Rozpocznij
                      </span>
                    </Link>

                    <Link href={catalogHref} className={cn(altCardClass, "lg:flex-1")}>
                      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-btn bg-white/[0.04]">
                        <LayoutGrid className="size-4 text-muted" aria-hidden />
                      </div>
                      <h4 className="font-body text-body-sm font-medium text-primary">
                        Katalog pytań
                      </h4>
                      <p className="mt-1 font-body text-[11px] leading-snug text-muted">
                        Przeglądaj pytania i wyjaśnienia
                      </p>
                      <span className="mt-auto pt-2.5 font-body text-body-xs font-medium text-brand-sage">
                        Przeglądaj
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
