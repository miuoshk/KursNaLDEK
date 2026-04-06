"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { statAxisTick, statTooltipProps } from "@/features/statistics/lib/chartTheme";
import type { StatisticsPayload } from "@/features/statistics/types";

export function AccuracyTrendChart({ data }: { data: StatisticsPayload }) {
  const chartData = data.accuracyTrend.map((d) => ({
    ...d,
    pct: Math.round(d.accuracy * 100),
  }));

  const empty = chartData.length === 0 || chartData.every((d) => d.pct === 0);
  const displayData = empty
    ? [{ date: "", accuracy: 0, pct: 0 }]
    : chartData;

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayData}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={statAxisTick} tickLine={false} axisLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={statAxisTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            {...statTooltipProps}
            formatter={(v) => [`${Number(v ?? 0)}%`, "Poprawność"]}
          />
          <Area
            type="monotone"
            dataKey="pct"
            stroke="var(--color-brand-gold)"
            fill="var(--color-brand-gold)"
            fillOpacity={0.1}
            strokeWidth={2}
            isAnimationActive={!empty}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
