export const DEVICE_CLASSES = [
  "mac",
  "windows",
  "iphone",
  "android",
  "ipad",
  "android_tablet",
  "other",
] as const;

export type DeviceClass = (typeof DEVICE_CLASSES)[number];

export type DeviceSignals = {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
};

const DEVICE_CLASS_SET = new Set<string>(DEVICE_CLASSES);

export function isDeviceClass(value: unknown): value is DeviceClass {
  return typeof value === "string" && DEVICE_CLASS_SET.has(value);
}

function isAndroidTabletUa(ua: string): boolean {
  if (ua.includes("tablet") || ua.includes("silk")) return true;
  // Telefony Android prawie zawsze mają token Mobile; tablety często go pomijają.
  return !ua.includes("mobile");
}

/**
 * Klasyfikuje urządzenie z UA / platform / maxTouchPoints.
 * iPadOS 13+ zgłasza się jako Macintosh — odróżniamy po maxTouchPoints > 1.
 * Tablet Android vs telefon: token Mobile (oraz Tablet/Silk).
 */
export function classifyDevice(signals: DeviceSignals): DeviceClass {
  const ua = signals.userAgent.toLowerCase();
  const platform = (signals.platform ?? "").toLowerCase();
  const maxTouchPoints = signals.maxTouchPoints ?? 0;

  const ipadOsDesktopUa = ua.includes("macintosh") && maxTouchPoints > 1;
  if (ua.includes("ipad") || platform.includes("ipad") || ipadOsDesktopUa) {
    return "ipad";
  }

  if (/\b(iphone|ipod)\b/.test(ua) || platform.includes("iphone")) {
    return "iphone";
  }

  if (
    ua.includes("macintosh") ||
    ua.includes("mac os x") ||
    platform === "macos" ||
    platform === "macintel"
  ) {
    return "mac";
  }

  if (ua.includes("android") || platform === "android") {
    return isAndroidTabletUa(ua) ? "android_tablet" : "android";
  }

  if (ua.includes("windows") || platform.startsWith("win")) {
    return "windows";
  }

  return "other";
}

export function collectBrowserDeviceSignals(): DeviceSignals {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  };
}
