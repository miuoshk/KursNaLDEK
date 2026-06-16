"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProgressPoint } from "@/features/pulpit/server/loadProgressHistory";
import { getBcp47Locale } from "@/lib/i18n/bcp47Locale";
import type { AppLocale } from "@/i18n/config";

type RangeOption = 30 | 60;

function CustomTooltip({
  active,
  payload,
  locale,
  t,
  tCommon,
}: {
  active?: boolean;
  payload?: { payload: ProgressPoint }[];
  locale: AppLocale;
  t: ReturnType<typeof useTranslations<"pulpit">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  if (!active || !payload?.[0]) return null;
  const p = payload[0].payload;
  const dateLabel = new Intl.DateTimeFormat(getBcp47Locale(locale), {
    day: "numeric",
    month: "short",
  }).format(new Date(p.day + "T00:00:00"));
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="font-body text-xs text-secondary">{dateLabel}</p>
      <p className="mt-1 font-body text-sm text-primary">
        {t("accuracyLabel")}{" "}
        <span className="text-brand-gold">{p.avgAccuracy}%</span>
      </p>
      <p className="font-body text-xs text-secondary">
        {tCommon("questionsCount", { count: p.totalQuestions })}
      </p>
    </div>
  );
}

type Props = { progressHistory: ProgressPoint[] };

export function ProgressChart({ progressHistory }: Props) {
  const t = useTranslations("pulpit");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const [range, setRange] = useState<RangeOption>(30);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(getBcp47Locale(locale), {
        day: "numeric",
        month: "short",
      }),
    [locale],
  );

  const filtered = useMemo(() => {
    if (range >= 60) return progressHistory;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    const cutoffYmd = cutoff.toISOString().slice(0, 10);
    return progressHistory.filter((p) => p.day >= cutoffYmd);
  }, [progressHistory, range]);

  const tooFew = filtered.length < 3;

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-xl font-bold text-primary">
          {t("yourProgress")}
        </h2>
        <select
          value={range}
          onChange={(e) => setRange(Number(e.target.value) as RangeOption)}
          className="rounded-btn border border-border bg-card px-3 py-1.5 font-body text-sm text-secondary outline-none transition-colors hover:border-brand-sage/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
        >
          <option value={30}>{t("last30Days")}</option>
          <option value={60}>{t("last60Days")}</option>
        </select>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        {tooFew ? (
          <div className="flex items-center justify-center py-16">
            <p className="font-body text-sm text-secondary">
              {t("progressChartEmpty")}
            </p>
          </div>
        ) : (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filtered}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(54,115,104,0.15)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tickFormatter={(ymd) =>
                    dateFmt.format(new Date(ymd + "T00:00:00"))
                  }
                  tick={{ fontSize: 10, fill: "#8B9E8B" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  content={
                    <CustomTooltip locale={locale} t={t} tCommon={tCommon} />
                  }
                  cursor={{ stroke: "rgba(201,168,76,0.2)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="avgAccuracy"
                  stroke="#C9A84C"
                  strokeWidth={2}
                  fill="url(#goldGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#C9A84C",
                    stroke: "#002A27",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
