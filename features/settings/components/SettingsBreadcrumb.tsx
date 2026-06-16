"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useDashboardBreadcrumb } from "@/features/shared/contexts/DashboardBreadcrumbContext";

export function SettingsBreadcrumb() {
  const t = useTranslations("settings");
  const { setSecondSegment } = useDashboardBreadcrumb();
  useEffect(() => {
    setSecondSegment(t("breadcrumb"));
    return () => setSecondSegment(null);
  }, [setSecondSegment, t]);
  return null;
}
