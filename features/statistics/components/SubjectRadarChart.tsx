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

  const raw = data.subjectMastery.map((s) => ({
    name: s.subjectName.length > 10 ? `${s.subjectName.slice(0, 9)}…` : s.subjectName,
    mastery: Math.round(s.mastery * 100),
  }));
  const chartData = raw.length > 0 ? raw : [{ name: "—", mastery: 0 }];
  const showEmptyHint = raw.length === 0;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius={outerRadius}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <PolarAngleAxis dataKey="name" tick={statAxisTick} tickLine={false} />
          <Tooltip {...statTooltipProps} />
          <Radar
            name="Opanowanie"
            dataKey="mastery"
            stroke="#C9A84C"
            fill="#C9A84C"
            fillOpacity={0.15}
            strokeWidth={1.5}
            isAnimationActive={raw.length > 0}
          />
        </RadarChart>
      </ResponsiveContainer>
      {showEmptyHint ? (
        <p className="mt-2 text-center font-body text-body-sm text-muted">
          Odpowiadaj na pytania, aby widzieć postęp.
        </p>
      ) : null}
    </div>
  );
}
