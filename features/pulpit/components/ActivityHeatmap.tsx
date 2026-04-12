"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import type { ActivityDay } from "@/features/pulpit/server/loadActivityHeatmap";

const WEEKS = 13;
const DAY_LABELS: [number, string][] = [[0, "Pn"], [2, "Śr"], [4, "Pt"]];

const MONTH_FMT = new Intl.DateTimeFormat("pl-PL", { month: "short" });
const TOOLTIP_FMT = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function cellColor(count: number): string {
  if (count === 0) return "bg-background border-white/[0.04]";
  if (count <= 5) return "bg-[#0d2b2a] border-white/[0.04]";
  if (count <= 15) return "bg-[#1a4a40] border-white/[0.04]";
  if (count <= 30) return "bg-brand-sage border-brand-sage/30";
  return "bg-brand-gold border-brand-gold/30";
}

const LEGEND_COLORS = [
  "bg-background border-white/[0.04]",
  "bg-[#0d2b2a] border-white/[0.04]",
  "bg-[#1a4a40] border-white/[0.04]",
  "bg-brand-sage border-brand-sage/30",
  "bg-brand-gold border-brand-gold/30",
];

type CellData = { date: Date; ymd: string; count: number };

function fmtYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildGrid(activityDays: ActivityDay[]) {
  const lookup = new Map(activityDays.map((d) => [d.day, d.count]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayDow = (today.getDay() + 6) % 7;
  const gridStart = new Date(today);
  gridStart.setDate(gridStart.getDate() - (WEEKS * 7 - 1) - todayDow);

  const weeks: CellData[][] = [];
  const cursor = new Date(gridStart);

  for (let w = 0; w < WEEKS; w++) {
    const week: CellData[] = [];
    for (let d = 0; d < 7; d++) {
      const ymd = fmtYmd(cursor);
      const isFuture = cursor > today;
      week.push({
        date: new Date(cursor),
        ymd,
        count: isFuture ? -1 : (lookup.get(ymd) ?? 0),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function getMonthLabels(weeks: CellData[][]) {
  const labels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    const m = weeks[w][0].date.getMonth();
    if (m !== lastMonth) {
      labels.push({ col: w, label: MONTH_FMT.format(weeks[w][0].date) });
      lastMonth = m;
    }
  }
  return labels;
}

type Props = { activityDays: ActivityDay[] };

export function ActivityHeatmap({ activityDays }: Props) {
  if (activityDays.length === 0) {
    return (
      <section>
        <h2 className="font-heading text-xl font-bold text-primary">
          Twoja aktywność
        </h2>
        <div className="mt-4 rounded-2xl border border-border bg-card py-12 text-center">
          <p className="font-body text-sm text-secondary">
            Zacznij rozwiązywać pytania, a tu pojawi się Twoja mapa aktywności.
          </p>
        </div>
      </section>
    );
  }

  const weeks = buildGrid(activityDays);
  const months = getMonthLabels(weeks);
  const totalQuestions = activityDays.reduce((s, d) => s + d.count, 0);

  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-primary">
        Twoja aktywność
      </h2>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card p-5">
        <div className="inline-flex gap-0">
          {/* Day labels column */}
          <div className="flex w-7 shrink-0 flex-col pr-1.5" style={{ paddingTop: 20 }}>
            {Array.from({ length: 7 }, (_, i) => {
              const entry = DAY_LABELS.find(([row]) => row === i);
              return (
                <div
                  key={i}
                  className="flex items-center"
                  style={{ height: 14, marginBottom: i < 6 ? 3 : 0 }}
                >
                  {entry && (
                    <span className="font-body text-[10px] leading-none text-secondary">
                      {entry[1]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid area */}
          <div>
            {/* Month labels */}
            <div className="flex" style={{ height: 16, marginBottom: 4 }}>
              {weeks.map((_, wi) => {
                const m = months.find((l) => l.col === wi);
                return (
                  <div
                    key={wi}
                    style={{ width: 14, marginRight: wi < WEEKS - 1 ? 3 : 0 }}
                  >
                    {m && (
                      <span className="font-body text-[10px] leading-none text-secondary">
                        {m.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cells grid: columns = weeks, rows = days */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((cell) => {
                    if (cell.count < 0) {
                      return (
                        <div
                          key={cell.ymd}
                          className="size-[14px] rounded-sm"
                        />
                      );
                    }
                    return <HeatmapCell key={cell.ymd} cell={cell} />;
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="font-body text-sm text-secondary">
            {totalQuestions} pytań w ostatnich 13 tygodniach
          </p>
          <div className="flex items-center gap-1.5">
            <span className="font-body text-[10px] text-secondary">Mniej</span>
            {LEGEND_COLORS.map((cls, i) => (
              <span
                key={i}
                className={`inline-block size-[10px] rounded-sm border ${cls}`}
              />
            ))}
            <span className="font-body text-[10px] text-secondary">Więcej</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeatmapCell({ cell }: { cell: CellData }) {
  const label =
    cell.count > 0
      ? `${TOOLTIP_FMT.format(cell.date)} — ${cell.count} pytań`
      : `${TOOLTIP_FMT.format(cell.date)} — brak aktywności`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`size-[14px] cursor-default rounded-sm border transition-colors duration-150 ${cellColor(cell.count)}`}
        />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="z-50 rounded-lg border border-border bg-card px-3 py-1.5 font-body text-body-xs text-primary shadow-lg"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
