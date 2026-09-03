import { AppWindow, Laptop, Monitor, Smartphone, Tablet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DeviceClass } from "@/features/shared/lib/classifyDevice";

export const DEVICE_LABEL: Record<DeviceClass, string> = {
  mac: "Mac",
  windows: "PC (Windows)",
  iphone: "iPhone",
  android: "Android",
  ipad: "iPad",
  android_tablet: "Tablet Android",
  other: "Inne",
};

export const DEVICE_COLOR: Record<DeviceClass, string> = {
  mac: "#C9A84C",
  windows: "#a387f2",
  iphone: "#367368",
  android: "#e3a86a",
  ipad: "#7aa6ff",
  android_tablet: "#52c4a5",
  other: "rgba(255,255,255,0.22)",
};

export const DEVICE_ICON: Record<DeviceClass, LucideIcon> = {
  mac: Monitor,
  windows: Laptop,
  iphone: Smartphone,
  android: Smartphone,
  ipad: Tablet,
  android_tablet: Tablet,
  other: AppWindow,
};

export const DEVICE_KPI_TONE: Record<
  DeviceClass,
  "gold" | "sage" | "neutral" | "warning"
> = {
  mac: "gold",
  windows: "sage",
  iphone: "gold",
  android: "warning",
  ipad: "sage",
  android_tablet: "warning",
  other: "neutral",
};
