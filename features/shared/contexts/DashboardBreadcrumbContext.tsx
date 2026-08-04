"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { StudyProduct } from "@/features/access/lib/studyAccess";

type DashboardBreadcrumbContextValue = {
  year: number;
  currentProduct: StudyProduct;
  secondSegment: string | null;
  thirdSegment: string | null;
  setSecondSegment: (segment: string | null) => void;
  setThirdSegment: (segment: string | null) => void;
};

const DashboardBreadcrumbContext =
  createContext<DashboardBreadcrumbContextValue | null>(null);

export function DashboardBreadcrumbProvider({
  year,
  currentProduct,
  children,
}: {
  year: number;
  currentProduct: StudyProduct;
  children: ReactNode;
}) {
  const [secondSegment, setSecondSegmentState] = useState<string | null>(null);
  const [thirdSegment, setThirdSegmentState] = useState<string | null>(null);

  const setSecondSegment = useCallback((segment: string | null) => {
    setSecondSegmentState(segment);
  }, []);

  const setThirdSegment = useCallback((segment: string | null) => {
    setThirdSegmentState(segment);
  }, []);

  const value = useMemo(
    () => ({
      year,
      currentProduct,
      secondSegment,
      thirdSegment,
      setSecondSegment,
      setThirdSegment,
    }),
    [year, currentProduct, secondSegment, thirdSegment, setSecondSegment, setThirdSegment],
  );

  return (
    <DashboardBreadcrumbContext.Provider value={value}>
      {children}
    </DashboardBreadcrumbContext.Provider>
  );
}

export function useDashboardBreadcrumb() {
  const ctx = useContext(DashboardBreadcrumbContext);
  if (!ctx) {
    throw new Error("useDashboardBreadcrumb must be used within DashboardBreadcrumbProvider");
  }
  return ctx;
}
