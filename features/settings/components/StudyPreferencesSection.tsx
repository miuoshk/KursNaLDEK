"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { updateStudyPreferences } from "@/features/settings/api/updateStudyPreferences";
import type { SettingsProfile } from "@/features/settings/types";
import type { SessionMode } from "@/features/session/types";
import { useToast } from "@/features/shared/components/ToastProvider";

const selectClass =
  "w-full appearance-none rounded-btn border border-[rgba(255,255,255,0.1)] bg-brand-bg px-4 py-3 pr-10 font-body text-white transition-colors focus:border-brand-gold focus:outline-none";

type Props = { profile: SettingsProfile };

function normalizeCount(n: number): 10 | 25 | 50 {
  if (n === 10 || n === 25 || n === 50) return n;
  return 25;
}

export function StudyPreferencesSection({ profile }: Props) {
  const { toast } = useToast();
  const [goal, setGoal] = useState(profile.daily_goal);
  const [mode, setMode] = useState<SessionMode>(profile.default_session_mode);
  const [count, setCount] = useState<10 | 25 | 50>(normalizeCount(profile.default_question_count));
  const [savedFlash, setSavedFlash] = useState(false);
  const skip = useRef(true);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const t = setTimeout(async () => {
      const res = await updateStudyPreferences({
        daily_goal: goal,
        default_session_mode: mode,
        default_question_count: count,
      });
      if (res.ok) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
      } else toast(res.message, "error");
    }, 500);
    return () => clearTimeout(t);
  }, [goal, mode, count, toast]);

  function bump(delta: number) {
    setGoal((g) => Math.min(100, Math.max(5, Math.round((g + delta) / 5) * 5)));
  }

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-body-xs font-medium uppercase tracking-widest text-muted">NAUKA</h2>
        {savedFlash ? (
          <span className="font-body text-body-xs text-brand-sage">Zapisano</span>
        ) : null}
      </div>
      <div className="mt-6 space-y-6">
        <div>
          <p className="font-body text-body-sm text-secondary">Cel dzienny</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => bump(-5)}
              className="flex size-10 items-center justify-center rounded-btn bg-brand-card-1 text-primary transition hover:bg-brand-sage/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)] active:scale-[0.98]"
              aria-label="Zmniejsz cel"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="min-w-[7rem] font-mono text-body-lg text-primary">{goal} pytań</span>
            <button
              type="button"
              onClick={() => bump(5)}
              className="flex size-10 items-center justify-center rounded-btn bg-brand-card-1 text-primary transition hover:bg-brand-sage/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)] active:scale-[0.98]"
              aria-label="Zwiększ cel"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="sm" className="font-body text-body-sm text-secondary">
            Domyślny tryb sesji
          </label>
          <div className="relative mt-1.5">
            <select
              id="sm"
              value={mode}
              onChange={(e) => setMode(e.target.value as SessionMode)}
              className={selectClass}
            >
              <option value="inteligentna">Inteligentna sesja</option>
              <option value="przeglad">Szybki przegląd</option>
              <option value="katalog">Katalog pytań</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
          </div>
        </div>
        <div>
          <label htmlFor="qc" className="font-body text-body-sm text-secondary">
            Domyślna liczba pytań
          </label>
          <div className="relative mt-1.5">
            <select
              id="qc"
              value={count}
              onChange={(e) => setCount(Number(e.target.value) as 10 | 25 | 50)}
              className={selectClass}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  );
}
