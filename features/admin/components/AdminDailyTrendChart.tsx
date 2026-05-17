"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { statAxisTick, statTooltipProps } from "@/features/statistics/lib/chartTheme";

type DailyTrendPoint = {
  date: string;
  sessions: number;
  users: number;
  questions: number;
  studyHours: number;
  avgAccuracy: number;
};

type AdminDailyTrendChartProps = {
  data: DailyTrendPoint[];
};

export function AdminDailyTrendChart({ data }: AdminDailyTrendChartProps) {
  const chartData = data.map((row) => ({
    ...row,
    label: row.date.slice(5),
  }));

  const empty = chartData.length === 0;
  const displayData = empty
    ? [{ date: "", label: "", sessions: 0, users: 0, questions: 0, studyHours: 0, avgAccuracy: 0 }]
    : chartData;

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayData}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tick={statAxisTick} tickLine={false} axisLine={false} />
          <YAxis tick={statAxisTick} tickLine={false} axisLine={false} />
          <Tooltip
            {...statTooltipProps}
            formatter={(value, name) => {
              const numericValue =
                typeof value === "number"
                  ? value
                  : typeof value === "string"
                    ? Number(value)
                    : NaN;
              const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

              if (name === "studyHours") return [`${safeValue} h`, "Czas nauki"];
              if (name === "avgAccuracy") return [`${safeValue}%`, "Śr. poprawność"];
              if (name === "sessions") return [safeValue, "Sesje"];
              if (name === "users") return [safeValue, "Aktywni użytkownicy"];
              if (name === "questions") return [safeValue, "Rozwiązane pytania"];
              return [safeValue, String(name)];
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="sessions"
            name="Sesje"
            stroke="var(--color-brand-gold)"
            fill="var(--color-brand-gold)"
            fillOpacity={0.08}
            strokeWidth={2}
            isAnimationActive={!empty}
          />
          <Area
            type="monotone"
            dataKey="users"
            name="Użytkownicy"
            stroke="var(--color-brand-sage)"
            fill="var(--color-brand-sage)"
            fillOpacity={0.08}
            strokeWidth={2}
            isAnimationActive={!empty}
          />
          <Area
            type="monotone"
            dataKey="questions"
            name="Pytania"
            stroke="#7aa6ff"
            fill="#7aa6ff"
            fillOpacity={0.06}
            strokeWidth={2}
            isAnimationActive={!empty}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
