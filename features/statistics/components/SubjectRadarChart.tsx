"use client";

import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { statAxisTick, statTooltipProps } from "@/features/statistics/lib/chartTheme";
import type { StatisticsPayload } from "@/features/statistics/types";

export function SubjectRadarChart({ data }: { data: StatisticsPayload }) {
  const [outerRadius, setOuterRadius] = useState("70%");
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setOuterRadius(mq.matches ? "52%" : "70%");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const chartData = data.subjectMastery.map((s) => ({
    name: s.subjectName.length > 10 ? `${s.subjectName.slice(0, 9)}…` : s.subjectName,
    mastery: Math.round(s.mastery * 100),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-card border border-[color:var(--border-subtle)] bg-brand-card-1 p-6 font-body text-body-sm text-muted">
        Odpowiedz na pytania, aby zobaczyć postęp.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius={outerRadius}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <PolarAngleAxis
            dataKey="name"
            tick={statAxisTick}
            tickLine={false}
          />
          <Tooltip {...statTooltipProps} />
          <Radar
            name="Opanowanie"
            dataKey="mastery"
            stroke="var(--color-brand-gold)"
            fill="var(--color-brand-gold)"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
