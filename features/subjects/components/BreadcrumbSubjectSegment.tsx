"use client";

import { useEffect } from "react";
import { useDashboardBreadcrumb } from "@/features/shared/contexts/DashboardBreadcrumbContext";

type BreadcrumbSubjectSegmentProps = {
  shortName: string;
};

/**
 * Ustawia drugi segment okruszka (np. skrót przedmiotu) na czas widoku strony.
 */
export function BreadcrumbSubjectSegment({ shortName }: BreadcrumbSubjectSegmentProps) {
  const { setSecondSegment } = useDashboardBreadcrumb();

  useEffect(() => {
    setSecondSegment(shortName);
    return () => setSecondSegment(null);
  }, [shortName, setSecondSegment]);

  return null;
}
