"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useState } from "react";
import { BookOpen, Brain, ListChecks, X } from "lucide-react";
import { cn } from "@/lib/utils";

const QUESTION_PRESETS = [10, 25, 50] as const;
type Preset = (typeof QUESTION_PRESETS)[number];

type TopicSessionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  topicName: string;
  subjectId: string;
  availableQuestionCount: number;
};

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

export function TopicSessionModal({
  open,
  onOpenChange,
  topicId,
  topicName,
  subjectId,
  availableQuestionCount,
}: TopicSessionModalProps) {
  const [preset, setPreset] = useState<Preset>(25);
  const maxQ = Math.max(1, availableQuestionCount);
  const count = Math.min(preset, maxQ);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-card border border-border bg-card p-6 shadow-xl focus:outline-none",
          )}
        >
          <Dialog.Close
            className="absolute right-4 top-4 rounded-button p-1 text-secondary transition-colors hover:text-primary"
            aria-label="Zamknij"
          >
            <X className="size-4" aria-hidden />
          </Dialog.Close>

          <Dialog.Title className="pr-8 font-heading text-heading-sm text-primary">
            {topicName}
          </Dialog.Title>

          <Dialog.Description className="mt-1 font-body text-body-sm text-secondary">
            Wybierz tryb nauki i liczbę pytań
          </Dialog.Description>

          {/* --- question count picker --- */}
          <div className="mt-5 border-t border-border pt-4">
            <p className="font-body text-body-xs uppercase tracking-normal text-muted">
              Liczba pytań
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUESTION_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={n > maxQ}
                  onClick={() => setPreset(n)}
                  className={cn(
                    "rounded-pill px-3 py-1 font-body text-body-sm transition-colors",
                    preset === n
                      ? "bg-brand-sage font-medium text-white"
                      : "cursor-pointer bg-card text-secondary hover:text-primary",
                    n > maxQ && "pointer-events-none opacity-30",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-2 font-body text-body-xs text-muted">
              Dostępnych pytań: {availableQuestionCount}
            </p>
          </div>

          {/* --- mode cards --- */}
          <div className="mt-5 space-y-3">
            <Link
              href={buildHref(subjectId, topicId, "inteligentna", count)}
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-start gap-3 rounded-card border border-brand-sage/25 bg-brand-sage/5 p-4",
                "transition-colors duration-200 ease-out hover:border-brand-sage/50 hover:bg-brand-sage/10",
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-sage/15 text-brand-sage">
                <Brain className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-body-md font-semibold text-primary">
                  Inteligentna sesja
                </p>
                <p className="mt-0.5 font-body text-body-xs text-secondary">
                  Algorytm dobierze pytania na podstawie Twojej wiedzy
                </p>
              </div>
            </Link>

            <Link
              href={buildHref(subjectId, topicId, "przeglad", count)}
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-start gap-3 rounded-card border border-border p-4",
                "transition-colors duration-200 ease-out hover:border-brand-sage/30 hover:bg-white/[0.02]",
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-secondary">
                <ListChecks className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-body-md font-semibold text-primary">
                  Szybki przegląd
                </p>
                <p className="mt-0.5 font-body text-body-xs text-secondary">
                  Przelatuj pytania bez algorytmu
                </p>
              </div>
            </Link>

            <Link
              href={buildHref(subjectId, topicId, "katalog", maxQ)}
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-start gap-3 rounded-card border border-border p-4",
                "transition-colors duration-200 ease-out hover:border-brand-sage/30 hover:bg-white/[0.02]",
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-secondary">
                <BookOpen className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-body-md font-semibold text-primary">
                  Katalog pytań
                </p>
                <p className="mt-0.5 font-body text-body-xs text-secondary">
                  Przeglądaj wszystkie pytania i wyjaśnienia
                </p>
              </div>
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
