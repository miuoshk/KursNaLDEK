"use client";

import type { ReactNode } from "react";
import { DeviceVisitTracker } from "@/features/shared/components/DeviceVisitTracker";
import { ToastProvider } from "@/features/shared/components/ToastProvider";

export function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <DeviceVisitTracker />
      {children}
    </ToastProvider>
  );
}
