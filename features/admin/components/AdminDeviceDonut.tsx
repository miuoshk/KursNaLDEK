"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { statTooltipProps } from "@/features/statistics/lib/chartTheme";
import type { DeviceClass } from "@/features/shared/lib/classifyDevice";
import type { AdminDeviceSlice } from "@/features/admin/lib/deviceStatsTypes";
import {
  DEVICE_COLOR,
  DEVICE_ICON,
  DEVICE_LABEL,
} from "@/features/admin/lib/deviceChartMeta";

type AdminDeviceDonutProps = {
  data: AdminDeviceSlice[];
};

export function AdminDeviceDonut({ data }: AdminDeviceDonutProps) {
  const totalVisitDays = data.reduce((sum, row) => sum + row.visitDays, 0);
  const chartData = data.filter((row) => row.visitDays > 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[200px_1fr]">
      <div className="relative h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData.length > 0 ? chartData : data}
              dataKey="visitDays"
              nameKey="deviceClass"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={3}
              stroke="#0a2322"
              strokeWidth={2}
            >
              {(chartData.length > 0 ? chartData : data).map((entry) => (
                <Cell
                  key={entry.deviceClass}
                  fill={DEVICE_COLOR[entry.deviceClass]}
                />
              ))}
            </Pie>
            <Tooltip
              {...statTooltipProps}
              formatter={(value, _name, item) => {
                const v = typeof value === "number" ? value : Number(value) || 0;
                const pct =
                  totalVisitDays > 0
                    ? Math.round((v / totalVisitDays) * 1000) / 10
                    : 0;
                const deviceClass = item?.payload?.deviceClass as DeviceClass | undefined;
                const label = deviceClass ? DEVICE_LABEL[deviceClass] : "Urządzenie";
                return [`${v} (${pct}%)`, label];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-heading-md text-primary tabular-nums">
            {totalVisitDays}
          </span>
          <span className="font-body text-body-xs text-muted">dni aktywności</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {totalVisitDays === 0 && (
          <li className="font-body text-body-sm text-muted">
            Brak danych — tracker zbiera od momentu wdrożenia.
          </li>
        )}
        {data.map((slice) => {
          const Icon = DEVICE_ICON[slice.deviceClass];
          return (
            <li
              key={slice.deviceClass}
              className="flex items-center justify-between rounded-btn border border-border bg-background/60 px-3 py-2 font-body text-body-sm"
            >
              <span className="inline-flex items-center gap-2 text-primary">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: DEVICE_COLOR[slice.deviceClass] }}
                  aria-hidden
                />
                <span className="inline-flex items-center gap-1.5">
                  <Icon className="size-4 text-secondary" aria-hidden />
                  {DEVICE_LABEL[slice.deviceClass]}
                </span>
              </span>
              <span className="font-body tabular-nums text-secondary">
                {slice.visitDays}{" "}
                <span className="text-muted">({slice.sharePct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
