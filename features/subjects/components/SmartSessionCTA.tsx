"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const questionPresets = [10, 25, 50] as const;

type SmartSessionCTAProps = {
  subjectId: string;
  availableQuestionCount: number;
};

export function SmartSessionCTA({
  subjectId,
  availableQuestionCount,
}: SmartSessionCTAProps) {
  const [preset, setPreset] = useState<(typeof questionPresets)[number]>(10);
  const maxQ = Math.max(1, availableQuestionCount);
  const questionCount = Math.min(preset, maxQ);

  const smartHref = useMemo(() => {
    const q = new URLSearchParams({
      subject: subjectId,
      mode: "inteligentna",
      count: String(questionCount),
    });
    return `/sesja/new?${q.toString()}`;
  }, [subjectId, questionCount]);

  const reviewHref = useMemo(() => {
    const q = new URLSearchParams({
      subject: subjectId,
      mode: "przeglad",
      count: String(questionCount),
    });
    return `/sesja/new?${q.toString()}`;
  }, [subjectId, questionCount]);

  const catalogHref = useMemo(() => {
    const q = new URLSearchParams({
      subject: subjectId,
      mode: "katalog",
      count: "500",
    });
    return `/sesja/new?${q.toString()}`;
  }, [subjectId]);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-heading-md text-primary">Rozpocznij naukę</h2>

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
          <div className="mt-2 flex flex-wrap gap-2">
            {questionPresets.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPreset(n)}
                className={cn(
                  "rounded-pill px-3 py-1 font-body text-body-sm transition-colors",
                  preset === n
                    ? "bg-brand-sage font-medium text-white"
                    : "cursor-pointer bg-card text-secondary hover:text-primary",
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-card p-5">
          <h3 className="font-body text-body-md font-semibold text-primary">
            Szybki przegląd
          </h3>
          <p className="mt-1 font-body text-body-sm text-secondary">
            Przelatuj pytania bez algorytmu
          </p>
          <Link
            href={reviewHref}
            className="mt-4 inline-flex items-center rounded-lg bg-brand-sage px-4 py-2 font-body text-body-sm font-medium text-white transition duration-200 ease-out hover:bg-[#4a9085] hover:shadow-[0_0_12px_rgba(54,115,104,0.35)]"
          >
            Rozpocznij
          </Link>
        </div>

        <div className="rounded-card border border-border bg-card p-5">
          <h3 className="font-body text-body-md font-semibold text-primary">
            Katalog pytań
          </h3>
          <p className="mt-1 font-body text-body-sm text-secondary">
            Przeglądaj wszystkie pytania i wyjaśnienia
          </p>
          <Link
            href={catalogHref}
            className="mt-4 inline-flex items-center rounded-lg border border-brand-sage/40 px-4 py-2 font-body text-body-sm font-medium text-brand-sage transition-colors duration-200 hover:bg-brand-sage/10"
          >
            Przeglądaj
          </Link>
        </div>
      </div>
    </div>
  );
}
