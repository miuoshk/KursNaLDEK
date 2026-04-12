"use client";

import Link from "next/link";
import { CheckCircle, Flame } from "lucide-react";
import { motion } from "framer-motion";
import type { PulpitData } from "@/features/pulpit/server/loadPulpit";
import { getCurrentRank, getNextRank, getXpProgress } from "@/features/gamification/lib/ranks";
import { cn } from "@/lib/utils";

const RING_R = 48;
const RING_C = 2 * Math.PI * RING_R;
const RING_VB = 120;
const RING_CX = RING_VB / 2;

function ringPct(done: number, goal: number) {
  if (goal <= 0) return 0;
  return Math.min(1, done / goal);
}

function CardShell({
  label,
  index,
  children,
}: {
  label: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.08 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <p className="mb-3 font-body text-xs uppercase tracking-widest text-secondary">
        {label}
      </p>
      {children}
    </motion.div>
  );
}

function DailyGoalCard({ data, index }: { data: PulpitData; index: number }) {
  const goalDone = data.questionsToday >= data.dailyGoal;
  const pct = ringPct(data.questionsToday, data.dailyGoal);

  return (
    <CardShell label="Cel dzienny" index={index}>
      <div className="flex flex-col items-center gap-2">
        <div className="relative size-[120px]">
          <svg
            className="size-full -rotate-90"
            viewBox={`0 0 ${RING_VB} ${RING_VB}`}
            aria-hidden
          >
            <circle
              cx={RING_CX}
              cy={RING_CX}
              r={RING_R}
              fill="none"
              stroke="rgba(54,115,104,0.3)"
              strokeWidth="8"
            />
            <circle
              cx={RING_CX}
              cy={RING_CX}
              r={RING_R}
              fill="none"
              stroke="var(--color-brand-gold)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - pct)}
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            {goalDone ? (
              <CheckCircle className="size-6 text-brand-gold" aria-hidden />
            ) : (
              <span className="font-heading text-2xl font-bold text-primary">
                {data.questionsToday}
                <span className="text-base font-normal text-secondary">
                  /{data.dailyGoal}
                </span>
              </span>
            )}
          </span>
        </div>
        <p className="font-body text-sm text-secondary">
          {goalDone
            ? "Cel osiągnięty!"
            : `${data.questionsToday} / ${data.dailyGoal} pytań`}
        </p>
      </div>
    </CardShell>
  );
}

function StreakCard({ data, index }: { data: PulpitData; index: number }) {
  const s = data.currentStreak;
  const flameColor =
    s === 0
      ? "text-secondary"
      : s >= 7
        ? "text-brand-gold"
        : "text-brand-gold";

  return (
    <CardShell label="Streak" index={index}>
      <div className="flex items-center gap-3">
        <Flame
          className={cn("size-9 shrink-0", flameColor)}
          aria-hidden
          style={
            s >= 7
              ? { filter: "drop-shadow(0 0 6px rgba(201,168,76,0.5))" }
              : undefined
          }
        />
        {s === 0 ? (
          <p className="font-heading text-4xl font-bold text-secondary">—</p>
        ) : (
          <p
            className={cn(
              "font-heading text-4xl font-bold",
              s >= 7 ? "bg-gradient-to-r from-brand-gold to-[#E5A855] bg-clip-text text-transparent" : "text-brand-gold",
            )}
          >
            {s}
          </p>
        )}
      </div>
      <p className="mt-3 font-body text-xs text-secondary">
        {s === 0
          ? "Zacznij nową serię!"
          : `Rekord: ${data.longestStreak} dni`}
      </p>
    </CardShell>
  );
}

function ReviewCard({ data, index }: { data: PulpitData; index: number }) {
  const d = data.dueReviews;
  const numColor =
    d === 0
      ? "text-secondary"
      : d <= 10
        ? "text-brand-gold"
        : "text-[#E5A855]";

  return (
    <CardShell label="Powtórki" index={index}>
      <p className={cn("font-heading text-4xl font-bold", numColor)}>{d}</p>
      {d > 0 ? (
        <Link
          href="/sesja/new?mode=inteligentna&count=10"
          className="mt-3 inline-flex items-center rounded-btn border border-brand-gold/40 px-3 py-1 font-body text-body-sm font-medium text-brand-gold transition-colors duration-200 ease-out hover:bg-brand-gold/10"
        >
          Powtórz
        </Link>
      ) : (
        <div className="mt-3 flex items-center gap-1.5">
          <CheckCircle className="size-4 text-secondary" aria-hidden />
          <p className="font-body text-sm text-secondary">Na bieżąco!</p>
        </div>
      )}
    </CardShell>
  );
}

function RankCard({ data, index }: { data: PulpitData; index: number }) {
  const rank = getCurrentRank(data.xp);
  const next = getNextRank(data.xp);
  const progress = getXpProgress(data.xp);

  return (
    <CardShell label="Ranga" index={index}>
      <p className="font-heading text-lg font-bold text-brand-gold">
        {rank.name}
      </p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-brand-gold transition-[width] duration-500 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="mt-2 font-body text-xs text-secondary">
        {next
          ? `${progress.current} / ${progress.needed} XP do ${next.name}`
          : `${data.xp} XP — najwyższa ranga!`}
      </p>
    </CardShell>
  );
}

export function PulpitTodayCards({ data }: { data: PulpitData }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <DailyGoalCard data={data} index={0} />
      <StreakCard data={data} index={1} />
      <ReviewCard data={data} index={2} />
      <RankCard data={data} index={3} />
    </div>
  );
}
