import { loadAdminDeviceStats } from "@/features/admin/server/loadAdminDeviceStats";
import { AdminDeviceDonut } from "@/features/admin/components/AdminDeviceDonut";
import { AdminDeviceTrendChart } from "@/features/admin/components/AdminDeviceTrendChart";
import { AdminKpiCard } from "@/features/admin/components/AdminKpiCard";
import {
  ChartCard,
  SectionHeader,
} from "@/features/admin/components/sections/AdminSectionsCommon";
import {
  DEVICE_ICON,
  DEVICE_KPI_TONE,
  DEVICE_LABEL,
} from "@/features/admin/lib/deviceChartMeta";
import { formatAdminCount } from "@/features/admin/lib/formatAdminMetric";
import { DEVICE_CLASSES } from "@/features/shared/lib/classifyDevice";

export async function DashboardDeviceSection() {
  const data = await loadAdminDeviceStats();

  return (
    <section>
      <SectionHeader
        title="Urządzenia"
        subtitle="Ruch zalogowanych użytkowników wg platformy (ostatnie 30 dni)"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DEVICE_CLASSES.map((deviceClass) => {
          const slice = data.totals.find((row) => row.deviceClass === deviceClass);
          const Icon = DEVICE_ICON[deviceClass];
          return (
            <AdminKpiCard
              key={deviceClass}
              label={DEVICE_LABEL[deviceClass]}
              value={slice?.uniqueUsers ?? 0}
              valueFormat="count"
              icon={Icon}
              tone={DEVICE_KPI_TONE[deviceClass]}
              hint={`${formatAdminCount(slice?.visitDays ?? 0)} dni aktywności`}
            />
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard
          title="Udział ruchu"
          subtitle="Dni aktywności (1 użytkownik × 1 dzień × urządzenie)"
        >
          <AdminDeviceDonut data={data.totals} />
        </ChartCard>
        <ChartCard
          title="Trend dzienny"
          subtitle="Unikalni użytkownicy danego dnia, wg urządzenia"
        >
          <AdminDeviceTrendChart data={data.trendLast30d} />
        </ChartCard>
      </div>
    </section>
  );
}
