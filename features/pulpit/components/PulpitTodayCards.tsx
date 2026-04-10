import Link from "next/link";
import { Flame } from "lucide-react";
import type { PulpitData } from "@/features/pulpit/server/loadPulpit";
import { cn } from "@/lib/utils";
import { formatStreak } from "@/lib/formatStreak";

const R_DESK = 26;
const R_MOB = 18;
const C_DESK = 2 * Math.PI * R_DESK;
const C_MOB = 2 * Math.PI * R_MOB;

function ringPct(done: number, goal: number) {
  if (goal <= 0) return 0;
  return Math.min(1, done / goal);
}

export function PulpitTodayCards({ data }: { data: PulpitData }) {
  const goalDone = data.questionsToday >= data.dailyGoal;
  const pct = ringPct(data.questionsToday, data.dailyGoal);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-card bg-card border border-border p-6">
        <p className="font-body text-body-xs uppercase tracking-widest text-muted">Cel dzienny</p>
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div className="relative size-12 shrink-0 sm:size-16">
            <svg
              className="size-full -rotate-90 sm:hidden"
              viewBox="0 0 48 48"
              aria-hidden
            >
              <circle cx="24" cy="24" r={R_MOB} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
              <circle
                cx="24"
                cy="24"
                r={R_MOB}
                fill="none"
                stroke={goalDone ? "var(--color-success)" : "var(--color-brand-gold)"}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={C_MOB}
                strokeDashoffset={C_MOB * (1 - pct)}
              />
            </svg>
            <svg
              className="hidden size-full -rotate-90 sm:block"
              viewBox="0 0 64 64"
              aria-hidden
            >
              <circle cx="32" cy="32" r={R_DESK} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <circle
                cx="32"
                cy="32"
                r={R_DESK}
                fill="none"
                stroke={goalDone ? "var(--color-success)" : "var(--color-brand-gold)"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={C_DESK}
                strokeDashoffset={C_DESK * (1 - pct)}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-primary sm:text-body-sm">
              {data.questionsToday} / {data.dailyGoal}
            </span>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-body text-body-xs text-muted">pytań dzisiaj</p>
            {goalDone ? (
              <p className="mt-1 font-body text-body-sm text-success">Cel osiągnięty!</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-card bg-card border border-border p-6">
        <p className="font-body text-body-xs uppercase tracking-widest text-muted">Streak</p>
        <div className="mt-4 flex items-center gap-2">
          <Flame className="size-8 text-brand-gold" aria-hidden />
          <p className="font-mono text-2xl text-brand-gold">
            {formatStreak(data.currentStreak)}
          </p>
        </div>
        <p className="mt-2 font-body text-body-xs text-muted">
          Najdłuższy: {formatStreak(data.longestStreak)}
        </p>
      </div>

      <div className="rounded-card bg-card border border-border p-6">
        <p className="font-body text-body-xs uppercase tracking-widest text-muted">
          Zaległe powtórki
        </p>
        <p
          className={cn(
            "mt-4 font-mono text-2xl",
            data.dueReviews > 0 ? "text-warning" : "text-success",
          )}
        >
          {data.dueReviews}
        </p>
        {data.dueReviews > 0 ? (
          <Link
            href="/sesja/new?mode=inteligentna&count=10"
            className="mt-3 inline-flex font-body text-body-sm text-brand-gold hover:underline"
          >
            Powtórz teraz →
          </Link>
        ) : (
          <p className="mt-3 font-body text-body-sm text-success">Brak zaległości!</p>
        )}
      </div>
    </div>
  );
}
