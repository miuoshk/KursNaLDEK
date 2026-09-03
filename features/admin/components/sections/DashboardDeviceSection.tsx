import { loadAdminDeviceStats } from "@/features/admin/server/loadAdminDeviceStats";
import {
  AdminDeviceDonut,
  DEVICE_ICON,
  DEVICE_LABEL,
} from "@/features/admin/components/AdminDeviceDonut";
import { AdminDeviceTrendChart } from "@/features/admin/components/AdminDeviceTrendChart";
import { AdminKpiCard } from "@/features/admin/components/AdminKpiCard";
import {
  ChartCard,
  SectionHeader,
} from "@/features/admin/components/sections/AdminSectionsCommon";
import { formatAdminCount } from "@/features/admin/lib/formatAdminMetric";
import { DEVICE_CLASSES } from "@/features/shared/lib/classifyDevice";
import type { DeviceClass } from "@/features/shared/lib/classifyDevice";

const KPI_TONE: Record<DeviceClass, "gold" | "sage" | "neutral" | "warning"> = {
  mac: "gold",
  windows: "sage",
  iphone: "gold",
  android: "warning",
  ipad: "sage",
  android_tablet: "warning",
  other: "neutral",
};

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
              tone={KPI_TONE[deviceClass]}
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
