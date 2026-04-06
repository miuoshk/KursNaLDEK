"use client";

import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { statAxisTick, statTooltipProps } from "@/features/statistics/lib/chartTheme";
import type { StatisticsPayload } from "@/features/statistics/types";

export function StudyTimeChart({ data }: { data: StatisticsPayload }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const chartData = data.studyTimePerDay.map((d) => ({
    ...d,
    hours: d.minutes / 60,
    label: format(parseISO(d.date), "EEE", { locale: pl }),
    isToday: d.date === today,
  }));

  const hasData = chartData.some((d) => d.minutes > 0);

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={hasData ? chartData : chartData.map((d) => ({ ...d, hours: 0.05 }))}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={statAxisTick} tickLine={false} axisLine={false} />
          <YAxis
            tick={statAxisTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}h`}
          />
          <Tooltip
            {...statTooltipProps}
            formatter={(v) => [`${Number(v ?? 0).toFixed(2)} h`, "Czas"]}
          />
          <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.date}
                fill={
                  entry.isToday
                    ? "var(--color-brand-gold)"
                    : "var(--color-brand-sage)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
