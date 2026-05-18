"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { statAxisTick, statTooltipProps } from "@/features/statistics/lib/chartTheme";
import type { AdminTrackPerformance } from "@/features/admin/server/loadAdminDashboard";

type AdminTrackPerformanceChartProps = {
  data: AdminTrackPerformance[];
};

export function AdminTrackPerformanceChart({ data }: AdminTrackPerformanceChartProps) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
          barCategoryGap="20%"
        >
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={statAxisTick} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="left"
            tick={statAxisTick}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={statAxisTick}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip
            {...statTooltipProps}
            formatter={(value, name) => {
              const v = typeof value === "number" ? value : Number(value) || 0;
              if (name === "sessions") return [v, "Sesje"];
              if (name === "questions") return [v, "Pytania"];
              if (name === "avgAccuracy") return [`${v}%`, "Śr. poprawność"];
              if (name === "avgSessionMin") return [`${v} min`, "Śr. czas sesji"];
              return [v, String(name)];
            }}
          />
          <Legend
            wrapperStyle={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 12,
              paddingTop: 8,
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="sessions"
            name="Sesje"
            fill="var(--color-brand-sage)"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="avgAccuracy"
            name="Śr. poprawność (%)"
            fill="var(--color-brand-gold)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
