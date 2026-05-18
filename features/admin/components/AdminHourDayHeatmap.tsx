"use client";

import { useMemo } from "react";
import type { AdminHeatmapCell } from "@/features/admin/server/loadAdminDashboard";
import { cn } from "@/lib/utils";

type AdminHourDayHeatmapProps = {
  cells: AdminHeatmapCell[];
  maxSessions: number;
};

const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Pn..Nd
const DOW_LABEL_MAP: Record<number, string> = {
  0: "Nd",
  1: "Pn",
  2: "Wt",
  3: "Śr",
  4: "Cz",
  5: "Pt",
  6: "Sb",
};

function intensityColor(intensity: number): string {
  if (intensity === 0) return "rgba(255,255,255,0.04)";
  // brand-sage #367368 -> #C9A84C dla intensywnych
  const clamped = Math.max(0, Math.min(1, intensity));
  const eased = Math.sqrt(clamped);
  if (eased < 0.5) {
    const t = eased / 0.5;
    return `rgba(54, 115, 104, ${0.18 + t * 0.42})`;
  }
  const t = (eased - 0.5) / 0.5;
  const r = Math.round(54 + (201 - 54) * t);
  const g = Math.round(115 + (168 - 115) * t);
  const b = Math.round(104 + (76 - 104) * t);
  return `rgba(${r}, ${g}, ${b}, ${0.6 + t * 0.4})`;
}

export function AdminHourDayHeatmap({ cells, maxSessions }: AdminHourDayHeatmapProps) {
  const grid = useMemo(() => {
    const map = new Map<string, AdminHeatmapCell>();
    for (const cell of cells) map.set(`${cell.dow}-${cell.hour}`, cell);
    return DOW_ORDER.map((dow) => ({
      dow,
      label: DOW_LABEL_MAP[dow]!,
      hours: Array.from({ length: 24 }, (_, hour) =>
        map.get(`${dow}-${hour}`) ?? { dow, hour, sessions: 0, intensity: 0 },
      ),
    }));
  }, [cells]);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-[48px_repeat(24,minmax(20px,1fr))] gap-[3px] text-body-xs text-muted">
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className={cn(
                  "text-center tabular-nums",
                  h % 3 === 0 ? "text-secondary" : "opacity-40",
                )}
              >
                {h.toString().padStart(2, "0")}
              </div>
            ))}
            {grid.map((row) => (
              <RowFragment key={row.dow} label={row.label} hours={row.hours} maxSessions={maxSessions} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="font-body text-body-xs text-muted">
          Każda komórka = jedna godzina. Czas lokalny serwera.
        </p>
        <div className="flex items-center gap-2 font-body text-body-xs text-muted">
          <span>Mniej</span>
          <div className="flex h-3 w-32 overflow-hidden rounded-full border border-border">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((i) => (
              <div
                key={i}
                className="flex-1"
                style={{ background: intensityColor(i) }}
              />
            ))}
          </div>
          <span>Więcej</span>
        </div>
      </div>
    </div>
  );
}

function RowFragment({
  label,
  hours,
  maxSessions,
}: {
  label: string;
  hours: AdminHeatmapCell[];
  maxSessions: number;
}) {
  return (
    <>
      <div className="flex items-center font-body text-body-xs uppercase tracking-widest text-muted">
        {label}
      </div>
      {hours.map((cell) => (
        <div
          key={`${cell.dow}-${cell.hour}`}
          title={`${label} ${cell.hour.toString().padStart(2, "0")}:00 — ${cell.sessions} sesji`}
          className="aspect-square min-h-[20px] rounded-[3px] transition-colors"
          style={{ background: intensityColor(cell.intensity) }}
          aria-label={`${label} ${cell.hour}:00, ${cell.sessions} sesji${maxSessions ? ` z ${maxSessions} max` : ""}`}
        />
      ))}
    </>
  );
}
