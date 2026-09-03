import "server-only";

import { warsawYmd } from "@/lib/datetime/warsawCalendar";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEVICE_CLASSES,
  isDeviceClass,
  type DeviceClass,
} from "@/features/shared/lib/classifyDevice";

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

type RpcDailyRow = {
  visited_on?: unknown;
  device_class?: unknown;
  unique_users?: unknown;
};

type RpcTotalRow = {
  device_class?: unknown;
  unique_users?: unknown;
  visit_days?: unknown;
};

type RpcPayload = {
  daily?: unknown;
  totals?: unknown;
};

const EMPTY_TREND_POINT: Omit<AdminDeviceTrendPoint, "date"> =
  Object.fromEntries(DEVICE_CLASSES.map((deviceClass) => [deviceClass, 0])) as Omit<
    AdminDeviceTrendPoint,
    "date"
  >;

const APPLE_CLASSES: ReadonlySet<DeviceClass> = new Set(["mac", "iphone", "ipad"]);

function asInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

function emptyStats(now: Date): AdminDeviceStats {
  const totals: AdminDeviceSlice[] = DEVICE_CLASSES.map((deviceClass) => ({
    deviceClass,
    uniqueUsers: 0,
    visitDays: 0,
    sharePct: 0,
  }));
  const trendLast30d: AdminDeviceTrendPoint[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const date = warsawYmd(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
    trendLast30d.push({ date, ...EMPTY_TREND_POINT });
  }
  return {
    totals,
    trendLast30d,
    uniqueUsersLast30d: 0,
    appleUsersLast30d: 0,
    appleSharePct: 0,
    today: totals,
  };
}

function slicesFromTotals(
  rows: RpcTotalRow[],
  shareKey: "visitDays" | "uniqueUsers",
): AdminDeviceSlice[] {
  const byClass = new Map<DeviceClass, { uniqueUsers: number; visitDays: number }>();
  for (const deviceClass of DEVICE_CLASSES) {
    byClass.set(deviceClass, { uniqueUsers: 0, visitDays: 0 });
  }
  for (const row of rows) {
    if (!isDeviceClass(row.device_class)) continue;
    byClass.set(row.device_class, {
      uniqueUsers: asInt(row.unique_users),
      visitDays: asInt(row.visit_days),
    });
  }
  const totalShare = DEVICE_CLASSES.reduce((sum, deviceClass) => {
    const stats = byClass.get(deviceClass)!;
    return sum + stats[shareKey];
  }, 0);
  return DEVICE_CLASSES.map((deviceClass) => {
    const stats = byClass.get(deviceClass)!;
    const shareBase = stats[shareKey];
    return {
      deviceClass,
      uniqueUsers: stats.uniqueUsers,
      visitDays: stats.visitDays,
      sharePct:
        totalShare > 0 ? Number(((shareBase / totalShare) * 100).toFixed(1)) : 0,
    };
  });
}

export async function loadAdminDeviceStats(): Promise<AdminDeviceStats> {
  const now = new Date();
  const since = warsawYmd(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
  const today = warsawYmd(now);

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("admin_device_visit_stats", {
      p_since: since,
    });
    if (error) {
      console.error("[loadAdminDeviceStats]", error.message);
      return emptyStats(now);
    }

    const payload = (data ?? {}) as RpcPayload;
    const dailyRows = Array.isArray(payload.daily)
      ? (payload.daily as RpcDailyRow[])
      : [];
    const totalRows = Array.isArray(payload.totals)
      ? (payload.totals as RpcTotalRow[])
      : [];

    const totals = slicesFromTotals(totalRows, "visitDays");
    const uniqueUsersLast30d = totals.reduce((sum, row) => sum + row.uniqueUsers, 0);
    const appleUsersLast30d = totals
      .filter((row) => APPLE_CLASSES.has(row.deviceClass))
      .reduce((sum, row) => sum + row.uniqueUsers, 0);
    const visitDaysLast30d = totals.reduce((sum, row) => sum + row.visitDays, 0);
    const appleVisitDaysLast30d = totals
      .filter((row) => APPLE_CLASSES.has(row.deviceClass))
      .reduce((sum, row) => sum + row.visitDays, 0);
    const appleSharePct =
      visitDaysLast30d > 0
        ? Number(((appleVisitDaysLast30d / visitDaysLast30d) * 100).toFixed(1))
        : 0;

    const dailyMap = new Map<string, AdminDeviceTrendPoint>();
    for (let i = 29; i >= 0; i -= 1) {
      const date = warsawYmd(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
      dailyMap.set(date, { date, ...EMPTY_TREND_POINT });
    }
    for (const row of dailyRows) {
      const date =
        typeof row.visited_on === "string" ? row.visited_on.slice(0, 10) : "";
      const point = dailyMap.get(date);
      if (!point || !isDeviceClass(row.device_class)) continue;
      point[row.device_class] = asInt(row.unique_users);
    }
    const trendLast30d = Array.from(dailyMap.values());

    const todayPoint = dailyMap.get(today) ?? { date: today, ...EMPTY_TREND_POINT };
    const todayRows: RpcTotalRow[] = DEVICE_CLASSES.map((deviceClass) => ({
      device_class: deviceClass,
      unique_users: todayPoint[deviceClass],
      visit_days: todayPoint[deviceClass],
    }));
    const todaySlices = slicesFromTotals(todayRows, "uniqueUsers");

    return {
      totals,
      trendLast30d,
      uniqueUsersLast30d,
      appleUsersLast30d,
      appleSharePct,
      today: todaySlices,
    };
  } catch (error) {
    console.error("[loadAdminDeviceStats]", error);
    return emptyStats(now);
  }
}
