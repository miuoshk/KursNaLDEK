"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { AchievementRow } from "@/features/gamification/types";
import { achievementLucide } from "@/features/gamification/lib/achievementIcons";

function formatUnlockedAt(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function AchievementCard({ row }: { row: AchievementRow }) {
  const Icon = achievementLucide(row.icon);
  const inProgress = !row.unlocked && !row.locked;
  const pct = row.targetValue > 0 ? Math.min(100, (row.progress / row.targetValue) * 100) : 0;

  if (row.unlocked) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0.9 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="rounded-card border border-brand-gold/30 bg-brand-card-1 p-4"
      >
        <div className="flex justify-center">
          <Icon className="size-8 text-brand-gold" aria-hidden />
        </div>
        <h3 className="mt-3 text-center font-body text-body-sm font-semibold text-white">
          {row.name}
        </h3>
        <p className="mt-1 text-center text-body-xs text-secondary">{row.description}</p>
        {row.unlockedAt ? (
          <p className="mt-2 text-center font-body text-body-xs text-muted">
            {formatUnlockedAt(row.unlockedAt)}
          </p>
        ) : null}
      </motion.div>
    );
  }

  if (row.locked) {
    return (
      <div className="rounded-card border border-[rgba(255,255,255,0.06)] bg-brand-card-1 p-4 opacity-50">
        <div className="flex justify-center">
          <Lock className="size-8 text-muted" aria-hidden />
        </div>
        <h3 className="mt-3 text-center font-body text-body-sm font-semibold text-white">
          {row.name}
        </h3>
        <p className="mt-1 text-center font-body text-body-xs text-muted">???</p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-[rgba(255,255,255,0.06)] bg-brand-card-1 p-4">
      <div className="flex justify-center">
        <Icon className="size-8 text-secondary" aria-hidden />
      </div>
      <h3 className="mt-3 text-center font-body text-body-sm font-semibold text-white/80">
        {row.name}
      </h3>
      <p className="mt-1 text-center text-body-xs text-secondary/90">{row.description}</p>
      {inProgress ? (
        <div className="mt-3">
          <p className="mb-1 text-center font-mono text-body-xs text-muted">
            {row.progress} / {row.targetValue}
          </p>
          <div className="h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div
              className="h-full rounded-full bg-brand-gold/70 transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
