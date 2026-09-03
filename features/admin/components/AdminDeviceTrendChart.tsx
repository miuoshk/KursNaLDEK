"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { statAxisTick, statTooltipProps } from "@/features/statistics/lib/chartTheme";
import type { DeviceClass } from "@/features/shared/lib/classifyDevice";
import { DEVICE_CLASSES } from "@/features/shared/lib/classifyDevice";
import type { AdminDeviceTrendPoint } from "@/features/admin/server/loadAdminDeviceStats";
import { DEVICE_COLOR, DEVICE_LABEL } from "@/features/admin/components/AdminDeviceDonut";

type AdminDeviceTrendChartProps = {
  data: AdminDeviceTrendPoint[];
};

export function AdminDeviceTrendChart({ data }: AdminDeviceTrendChartProps) {
  const chartData = data.map((row) => ({
    ...row,
    label: row.date.slice(5),
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
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
            formatter={(value, name) => {
              const v = typeof value === "number" ? value : Number(value) || 0;
              const deviceClass = name as DeviceClass;
              return [v, DEVICE_LABEL[deviceClass] ?? String(name)];
            }}
            labelFormatter={(label) => `Dzień ${label}`}
          />
          <Legend
            formatter={(value) => DEVICE_LABEL[value as DeviceClass] ?? String(value)}
          />
          {DEVICE_CLASSES.map((deviceClass) => (
            <Bar
              key={deviceClass}
              dataKey={deviceClass}
              name={deviceClass}
              stackId="devices"
              fill={DEVICE_COLOR[deviceClass]}
              maxBarSize={18}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
