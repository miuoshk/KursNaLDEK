"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { statTooltipProps } from "@/features/statistics/lib/chartTheme";
import type { AdminSubscriptionSlice } from "@/features/admin/server/loadAdminDashboard";

type AdminSubscriptionDonutProps = {
  data: AdminSubscriptionSlice[];
};

function statusColor(status: string): string {
  if (status === "active") return "var(--color-success)";
  if (status === "inactive") return "#5f7672";
  if (status === "trialing") return "var(--color-brand-sage)";
  if (status === "past_due") return "var(--color-warning)";
  return "rgba(255,255,255,0.18)";
}

export function AdminSubscriptionDonut({ data }: AdminSubscriptionDonutProps) {
  const total = data.reduce((s, x) => s + x.count, 0);
  const active = data.find((d) => d.status === "active")?.count ?? 0;
  const conversion = total > 0 ? Math.round((active / total) * 1000) / 10 : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[200px_1fr]">
      <div className="relative h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={3}
              stroke="#0a2322"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={statusColor(entry.status)} />
              ))}
            </Pie>
            <Tooltip
              {...statTooltipProps}
              formatter={(value, _name, item) => {
                const v = typeof value === "number" ? value : Number(value) || 0;
                const pct = total > 0 ? Math.round((v / total) * 1000) / 10 : 0;
                return [`${v} (${pct}%)`, item?.payload?.label];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-heading-md text-success tabular-nums">
            {conversion}%
          </span>
          <span className="font-body text-body-xs text-muted">aktywne</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {data.length === 0 && (
          <li className="font-body text-body-sm text-muted">Brak danych.</li>
        )}
        {data.map((slice) => {
          const pct = total > 0 ? Math.round((slice.count / total) * 1000) / 10 : 0;
          return (
            <li
              key={slice.status}
              className="flex items-center justify-between rounded-btn border border-border bg-background/60 px-3 py-2 font-body text-body-sm"
            >
              <span className="inline-flex items-center gap-2 text-primary">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: statusColor(slice.status) }}
                  aria-hidden
                />
                {slice.label}
              </span>
              <span className="font-body tabular-nums text-secondary">
                {slice.count}{" "}
                <span className="text-muted">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
