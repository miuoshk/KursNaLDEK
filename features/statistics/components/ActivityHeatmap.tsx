"use client";

import { cn } from "@/lib/utils";

const LEVELS = [
  "bg-transparent",
  "bg-brand-gold/15",
  "bg-brand-gold/35",
  "bg-brand-gold/55",
  "bg-brand-gold",
];

export function ActivityHeatmap({
  cells,
}: {
  cells: { date: string; level: number }[];
}) {
  const grid = [...cells];
  while (grid.length < 35) grid.push({ date: "", level: 0 });

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {grid.slice(0, 35).map((c, i) => (
          <div
            key={c.date || `e-${i}`}
            title={c.date || undefined}
            className={cn(
              "aspect-square max-h-8 rounded-sm border border-border",
              LEVELS[Math.min(4, Math.max(0, c.level))] ?? LEVELS[0],
            )}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between font-body text-body-xs text-muted">
        <span>Mniej</span>
        <div className="flex gap-1">
          {LEVELS.slice(1).map((cls, i) => (
            <span key={i} className={cn("size-3 rounded-sm", cls)} />
          ))}
        </div>
        <span>Więcej</span>
      </div>
    </div>
  );
}
