"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { statAxisTick, statTooltipProps } from "@/features/statistics/lib/chartTheme";
import type { AdminSubjectPopularity } from "@/features/admin/server/loadAdminDashboard";

type AdminSubjectsBarChartProps = {
  data: AdminSubjectPopularity[];
};

export function AdminSubjectsBarChart({ data }: AdminSubjectsBarChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center font-body text-body-sm text-muted">
        Brak sesji z przypisanym przedmiotem w ostatnich 30 dniach.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label:
      d.subjectName.length > 28
        ? `${d.subjectName.slice(0, 28)}…`
        : d.subjectName,
  }));

  const dynamicHeight = Math.max(220, Math.min(chartData.length * 36 + 40, 520));

  return (
    <div className="w-full" style={{ height: dynamicHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 0, left: 4 }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis
            type="number"
            tick={statAxisTick}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ ...statAxisTick, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={170}
          />
          <Tooltip
            {...statTooltipProps}
            formatter={(value, name, item) => {
              const v = typeof value === "number" ? value : Number(value) || 0;
              if (name === "sessions") {
                const breakdown = item.payload.trackBreakdown as
                  | { track: string; sessions: number }[]
                  | undefined;
                if (breakdown && breakdown.length > 0) {
                  const detail = breakdown
                    .map((b) => `${b.track}: ${b.sessions}`)
                    .join(", ");
                  return [`${v} (${detail})`, "Sesje"];
                }
                return [v, "Sesje"];
              }
              if (name === "questions") return [v, "Pytania"];
              if (name === "avgAccuracy") return [`${v}%`, "Śr. poprawność"];
              return [v, String(name)];
            }}
          />
          <Bar
            dataKey="sessions"
            fill="var(--color-brand-gold)"
            radius={[0, 6, 6, 0]}
            barSize={16}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
