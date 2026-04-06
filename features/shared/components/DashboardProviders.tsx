"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/features/shared/components/ToastProvider";

export function DashboardProviders({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
