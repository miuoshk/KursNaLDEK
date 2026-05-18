"use client";

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
import type { AdminDayOfWeekBucket } from "@/features/admin/server/loadAdminDashboard";

type AdminDayOfWeekChartProps = {
  data: AdminDayOfWeekBucket[];
};

export function AdminDayOfWeekChart({ data }: AdminDayOfWeekChartProps) {
  const maxSessions = Math.max(0, ...data.map((d) => d.sessions));
  const chartData = data.map((d) => ({
    ...d,
    isPeak: d.sessions === maxSessions && maxSessions > 0,
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={statAxisTick} tickLine={false} axisLine={false} />
          <YAxis tick={statAxisTick} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            {...statTooltipProps}
            formatter={(value, name) => {
              const v = typeof value === "number" ? value : Number(value) || 0;
              if (name === "sessions") return [v, "Sesje"];
              if (name === "questions") return [v, "Pytania"];
              if (name === "avgAccuracy") return [`${v}%`, "Śr. poprawność"];
              return [v, String(name)];
            }}
          />
          <Bar dataKey="sessions" radius={[6, 6, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.label}
                fill={entry.isPeak ? "var(--color-brand-gold)" : "var(--color-brand-sage)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
