"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Snapshot profilu przekazywany z layoutu (serializowalny). */
export type DashboardProfileSnapshot = {
  display_name: string | null;
  current_streak: number | null;
  daily_goal: number | null;
  longest_streak: number | null;
  xp: number | null;
} | null;

type DashboardDataValue = {
  profile: DashboardProfileSnapshot;
  userEmail: string | null;
};

const DashboardDataContext = createContext<DashboardDataValue | null>(null);

export function DashboardDataProvider({
  children,
  profile,
  userEmail,
}: {
  children: ReactNode;
  profile: DashboardProfileSnapshot;
  userEmail: string | null;
}) {
  return (
    <DashboardDataContext.Provider value={{ profile, userEmail }}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error("useDashboardData wymaga DashboardDataProvider");
  }
  return ctx;
}
