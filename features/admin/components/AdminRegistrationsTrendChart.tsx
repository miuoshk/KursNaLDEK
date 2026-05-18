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
import type { AdminRegistrationsPoint } from "@/features/admin/server/loadAdminDashboard";

type AdminRegistrationsTrendChartProps = {
  data: AdminRegistrationsPoint[];
};

export function AdminRegistrationsTrendChart({ data }: AdminRegistrationsTrendChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-gold)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-brand-gold)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={statAxisTick}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis tick={statAxisTick} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            {...statTooltipProps}
            formatter={(value) => {
              const v = typeof value === "number" ? value : Number(value) || 0;
              return [v, "Rejestracje"];
            }}
            labelFormatter={(label) => `Dzień ${label}`}
          />
          <Area
            type="monotone"
            dataKey="registrations"
            stroke="var(--color-brand-gold)"
            fill="url(#regGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
