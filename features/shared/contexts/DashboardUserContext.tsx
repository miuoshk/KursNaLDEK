"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

export type DashboardUserValue = {
  streak: number;
  displayName: string;
  initials: string;
};

const DashboardUserContext = createContext<DashboardUserValue | null>(null);

export function DashboardUserProvider({
  value,
  children,
}: {
  value: DashboardUserValue;
  children: ReactNode;
}) {
  return (
    <DashboardUserContext.Provider value={value}>
      {children}
    </DashboardUserContext.Provider>
  );
}

export function useDashboardUser() {
  const ctx = useContext(DashboardUserContext);
  if (!ctx) {
    throw new Error("useDashboardUser wymaga DashboardUserProvider");
  }
  return ctx;
}
