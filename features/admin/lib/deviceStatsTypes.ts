import type { DeviceClass } from "@/features/shared/lib/classifyDevice";

export type AdminDeviceSlice = {
  deviceClass: DeviceClass;
  uniqueUsers: number;
  visitDays: number;
  sharePct: number;
};

export type AdminDeviceTrendPoint = { date: string } & Record<DeviceClass, number>;

export type AdminDeviceStats = {
  totals: AdminDeviceSlice[];
  trendLast30d: AdminDeviceTrendPoint[];
  uniqueUsersLast30d: number;
  appleUsersLast30d: number;
  appleSharePct: number;
  today: AdminDeviceSlice[];
};
