"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DashboardBreadcrumbContextValue = {
  year: number;
  secondSegment: string | null;
  thirdSegment: string | null;
  setSecondSegment: (segment: string | null) => void;
  setThirdSegment: (segment: string | null) => void;
};

const DashboardBreadcrumbContext =
  createContext<DashboardBreadcrumbContextValue | null>(null);

export function DashboardBreadcrumbProvider({
  year,
  children,
}: {
  year: number;
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
      secondSegment,
      thirdSegment,
      setSecondSegment,
      setThirdSegment,
    }),
    [year, secondSegment, thirdSegment, setSecondSegment, setThirdSegment],
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
