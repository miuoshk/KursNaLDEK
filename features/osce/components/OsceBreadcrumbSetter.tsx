"use client";

import { useEffect } from "react";
import { useDashboardBreadcrumb } from "@/features/shared/contexts/DashboardBreadcrumbContext";

type OsceBreadcrumbSetterProps = {
  second: string;
  third?: string | null;
};

export function OsceBreadcrumbSetter({ second, third = null }: OsceBreadcrumbSetterProps) {
  const { setSecondSegment, setThirdSegment } = useDashboardBreadcrumb();

  useEffect(() => {
    setSecondSegment(second);
    setThirdSegment(third);
    return () => {
      setSecondSegment(null);
      setThirdSegment(null);
    };
  }, [second, third, setSecondSegment, setThirdSegment]);

  return null;
}
