"use client";

import type { ReactNode } from "react";
import { KalkulatorAuthProvider } from "@/features/kalkulator/context/AuthContext";
import { KalkulatorErrorBoundary } from "@/features/kalkulator/components/KalkulatorErrorBoundary";

export function KalkulatorRoot({ children }: { children: ReactNode }) {
  return (
    <KalkulatorErrorBoundary>
      <KalkulatorAuthProvider>{children}</KalkulatorAuthProvider>
    </KalkulatorErrorBoundary>
  );
}
