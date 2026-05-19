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
import type { AdminFinanceMonthlyPoint } from "@/features/admin/server/loadAdminFinance";
import { statAxisTick, statTooltipProps } from "@/features/statistics/lib/chartTheme";

type Props = {
  data: AdminFinanceMonthlyPoint[];
  currency: string;
};

export function AdminMrrTrendChart({ data, currency }: Props) {
  const formatter = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  });

  const chartData = data.map((d) => ({
    label: d.label.replace(/ \d{4}$/, ""),
    fullLabel: d.label,
    grossRevenue: d.grossRevenue,
    successfulPayments: d.successfulPayments,
  }));

  const empty = chartData.length === 0;

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={empty ? [{ label: "", fullLabel: "", grossRevenue: 0, successfulPayments: 0 }] : chartData}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tick={statAxisTick} tickLine={false} axisLine={false} />
          <YAxis
            tick={statAxisTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => {
              const n = typeof v === "number" ? v : Number(v);
              if (!Number.isFinite(n)) return "";
              if (n >= 1000) return `${Math.round(n / 1000)} k`;
              return String(Math.round(n));
            }}
          />
          <Tooltip
            {...statTooltipProps}
            labelFormatter={(_, payload) => {
              const p = Array.isArray(payload) ? payload[0]?.payload : null;
              return p?.fullLabel ?? "";
            }}
            formatter={(value, name) => {
              const n = typeof value === "number" ? value : Number(value);
              if (name === "grossRevenue") return [formatter.format(Number.isFinite(n) ? n : 0), "Przychód"];
              if (name === "successfulPayments") return [Number.isFinite(n) ? n : 0, "Płatności"];
              return [value as never, String(name)];
            }}
          />
          <Area
            type="monotone"
            dataKey="grossRevenue"
            name="Przychód"
            stroke="var(--color-brand-gold)"
            fill="var(--color-brand-gold)"
            fillOpacity={0.12}
            strokeWidth={2}
            isAnimationActive={!empty}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
