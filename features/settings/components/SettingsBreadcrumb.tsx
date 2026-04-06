"use client";

import { useEffect } from "react";
import { useDashboardBreadcrumb } from "@/features/shared/contexts/DashboardBreadcrumbContext";

export function SettingsBreadcrumb() {
  const { setSecondSegment } = useDashboardBreadcrumb();
  useEffect(() => {
    setSecondSegment("Ustawienia");
    return () => setSecondSegment(null);
  }, [setSecondSegment]);
  return null;
}
