"use client";

import { Suspense } from "react";
import { KalkulatorAppGate } from "@/features/kalkulator/components/KalkulatorAppGate";
import { KalkulatorLoginForm } from "@/features/kalkulator/components/KalkulatorLoginForm";
import { useKalkulatorAuth } from "@/features/kalkulator/context/AuthContext";

function KalkulatorLogPageInner() {
  const { user, loading } = useKalkulatorAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <p className="font-body text-sm text-[color:var(--k-muted)]">Ładowanie sesji…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-6 py-16">
        <Suspense fallback={null}>
          <KalkulatorLoginForm />
        </Suspense>
      </div>
    );
  }

  return <KalkulatorAppGate mode="log" />;
}

export function KalkulatorLogPageClient() {
  return <KalkulatorLogPageInner />;
}
