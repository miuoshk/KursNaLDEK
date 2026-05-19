"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GrowthPoint } from "@/features/admin/server/loadAdminInvestor";
import { statAxisTick, statTooltipProps } from "@/features/statistics/lib/chartTheme";

type Props = { data: GrowthPoint[] };

export function AdminGrowthChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));
  const empty = chartData.length === 0;

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={
            empty
              ? [{ date: "", label: "", dau: 0, wau: 0, mau: 0 }]
              : chartData
          }
        >
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tick={statAxisTick} tickLine={false} axisLine={false} />
          <YAxis tick={statAxisTick} tickLine={false} axisLine={false} />
          <Tooltip
            {...statTooltipProps}
            formatter={(value, name) => {
              const n = typeof value === "number" ? value : Number(value);
              const safe = Number.isFinite(n) ? n : 0;
              if (name === "dau") return [safe, "DAU"];
              if (name === "wau") return [safe, "WAU"];
              if (name === "mau") return [safe, "MAU"];
              return [safe, String(name)];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="dau"
            name="DAU"
            stroke="var(--color-brand-gold)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={!empty}
          />
          <Line
            type="monotone"
            dataKey="wau"
            name="WAU"
            stroke="var(--color-brand-sage)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={!empty}
          />
          <Line
            type="monotone"
            dataKey="mau"
            name="MAU"
            stroke="#7aa6ff"
            strokeWidth={2}
            dot={false}
            isAnimationActive={!empty}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
