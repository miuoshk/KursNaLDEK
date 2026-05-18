"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { statTooltipProps } from "@/features/statistics/lib/chartTheme";
import type { AdminUserSegment } from "@/features/admin/server/loadAdminDashboard";
import { cn } from "@/lib/utils";

type AdminUserSegmentChartProps = {
  segments: AdminUserSegment[];
};

const PALETTE = [
  "#C9A84C", // brand-gold
  "#367368", // brand-sage
  "#7aa6ff",
  "#e3a86a",
  "#a387f2",
  "#52c4a5",
  "#d96a8b",
  "#9bd16a",
];

export function AdminUserSegmentChart({ segments }: AdminUserSegmentChartProps) {
  const total = segments.reduce((s, x) => s + x.count, 0);
  const data = segments.map((s, i) => ({
    name: s.label,
    value: s.count,
    color: PALETTE[i % PALETTE.length],
    activeLast30d: s.activeLast30d,
    avgXp: s.avgXp,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
      <div className="relative h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={64}
              outerRadius={96}
              paddingAngle={2}
              stroke="#0a2322"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              {...statTooltipProps}
              formatter={(value, _name, item) => {
                const v = typeof value === "number" ? value : Number(value) || 0;
                const pct = total > 0 ? Math.round((v / total) * 1000) / 10 : 0;
                return [`${v} (${pct}%)`, item?.payload?.name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-heading-md text-primary tabular-nums">
            {total}
          </span>
          <span className="font-body text-body-xs text-muted">użytkowników</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-card">
              <Th>Segment</Th>
              <Th>Liczba</Th>
              <Th>%</Th>
              <Th>Akt. 30d</Th>
              <Th>Śr. XP</Th>
              <Th>Śr. streak</Th>
            </tr>
          </thead>
          <tbody>
            {segments.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center font-body text-body-sm text-muted"
                >
                  Brak segmentów.
                </td>
              </tr>
            ) : (
              segments.map((s, i) => {
                const pct = total > 0 ? Math.round((s.count / total) * 1000) / 10 : 0;
                return (
                  <tr
                    key={s.label}
                    className="border-b border-border transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-2 font-body text-body-sm text-primary">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: PALETTE[i % PALETTE.length] }}
                          aria-hidden
                        />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-body text-body-sm text-secondary tabular-nums">
                      {s.count}
                    </td>
                    <td className="px-3 py-2 font-body text-body-sm text-secondary tabular-nums">
                      {pct}%
                    </td>
                    <td className="px-3 py-2 font-body text-body-sm text-secondary tabular-nums">
                      {s.activeLast30d}
                    </td>
                    <td className="px-3 py-2 font-body text-body-sm text-secondary tabular-nums">
                      {s.avgXp}
                    </td>
                    <td className="px-3 py-2 font-body text-body-sm text-secondary tabular-nums">
                      {s.avgStreak}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className={cn(
        "px-3 py-2 font-body text-body-xs uppercase tracking-widest text-muted",
      )}
    >
      {children}
    </th>
  );
}
