"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Root as SwitchRoot, Thumb as SwitchThumb } from "@radix-ui/react-switch";
import type { SessionMode } from "@/features/session/types";
import { cn } from "@/lib/utils";

const questionPresets = [10, 25, 50] as const;

const MODES: { label: string; value: SessionMode }[] = [
  { label: "Nauka", value: "nauka" },
  { label: "Egzamin", value: "egzamin" },
  { label: "Powtórka", value: "powtorka" },
];

type SmartSessionCTAProps = {
  subjectId: string;
  availableQuestionCount: number;
};

export function SmartSessionCTA({
  subjectId,
  availableQuestionCount,
}: SmartSessionCTAProps) {
  const [timeLimit, setTimeLimit] = useState(false);
  const [mode, setMode] = useState<SessionMode>("nauka");
  const [preset, setPreset] = useState<(typeof questionPresets)[number] | "wlasna">(10);
  const [customCount, setCustomCount] = useState(15);

  const maxQ = Math.max(1, availableQuestionCount);

  const questionCount = useMemo(() => {
    if (preset === "wlasna") {
      return Math.min(Math.max(1, customCount), maxQ);
    }
    return Math.min(preset, maxQ);
  }, [preset, customCount, maxQ]);

  const href = useMemo(() => {
    const q = new URLSearchParams({
      subject: subjectId,
      mode,
      count: String(questionCount),
    });
    if (timeLimit) q.set("timer", "1");
    return `/sesja/new?${q.toString()}`;
  }, [subjectId, mode, questionCount, timeLimit]);

  return (
    <div className="rounded-card border-l-[3px] border-brand-gold bg-brand-card-1 p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-heading-md text-primary">Inteligentna sesja nauki</h2>
          <p className="mt-2 font-body text-body-sm text-secondary">
            Algorytm dobierze pytania na podstawie Twoich słabych punktów i harmonogramu powtórek
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
        >
          Rozpocznij sesję
        </Link>
      </div>

      <div className="mt-8 space-y-6 border-t border-[color:var(--border-subtle)] pt-6">
        <div>
          <p className="font-body text-body-xs uppercase tracking-widest text-muted">Liczba pytań</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {([...questionPresets, "wlasna"] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPreset(n === "wlasna" ? "wlasna" : n)}
                className={cn(
                  "rounded-pill px-3 py-1 font-body text-body-sm transition-colors",
                  preset === n
                    ? "bg-brand-gold font-medium text-brand-bg"
                    : "cursor-pointer bg-brand-card-1 text-secondary hover:text-white",
                )}
              >
                {n === "wlasna" ? "Własna" : n}
              </button>
            ))}
          </div>
          {preset === "wlasna" ? (
            <label className="mt-3 flex max-w-[220px] items-center gap-2 font-body text-body-sm text-secondary">
              Liczba:
              <input
                type="number"
                min={1}
                max={maxQ}
                value={customCount}
                onChange={(e) => setCustomCount(Number(e.target.value) || 1)}
                className="w-full rounded-btn border border-[color:var(--border-subtle)] bg-brand-bg px-3 py-2 font-mono text-primary"
              />
            </label>
          ) : null}
          <p className="mt-2 font-body text-body-xs text-muted">
            Dostępnych pytań: {availableQuestionCount}
          </p>
        </div>

        <div>
          <p className="font-body text-body-xs uppercase tracking-widest text-muted">Tryb</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={cn(
                  "rounded-pill px-3 py-1 font-body text-body-sm transition-colors",
                  mode === m.value
                    ? "bg-brand-gold font-medium text-brand-bg"
                    : "cursor-pointer bg-brand-card-1 text-secondary hover:text-white",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="font-body text-body-xs uppercase tracking-widest text-muted">Limit czasu</p>
          <SwitchRoot
            checked={timeLimit}
            onCheckedChange={setTimeLimit}
            className="group relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border border-[rgba(255,255,255,0.12)] bg-brand-bg p-0.5 transition-colors data-[state=checked]:border-brand-sage/50 data-[state=checked]:bg-brand-accent-2"
            aria-label="Limit czasu sesji"
          >
            <SwitchThumb className="pointer-events-none block size-5 translate-x-0 rounded-full bg-white shadow transition-transform duration-200 ease-out will-change-transform group-data-[state=checked]:translate-x-[22px]" />
          </SwitchRoot>
        </div>
      </div>
    </div>
  );
}
