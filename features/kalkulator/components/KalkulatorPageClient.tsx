"use client";

import { Suspense } from "react";
import { KalkulatorAppGate } from "@/features/kalkulator/components/KalkulatorAppGate";
import { KalkulatorLoginForm } from "@/features/kalkulator/components/KalkulatorLoginForm";
import { KalkulatorShell } from "@/features/kalkulator/components/KalkulatorShell";
import { useKalkulatorAuth } from "@/features/kalkulator/context/AuthContext";

function KalkulatorLoginGate() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-6 py-16">
      <KalkulatorLoginForm />
    </div>
  );
}

function KalkulatorPageInner() {
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
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center px-6">
            <p className="font-body text-sm text-[color:var(--k-muted)]">Ładowanie…</p>
          </div>
        }
      >
        <KalkulatorLoginGate />
      </Suspense>
    );
  }

  return <KalkulatorAppGate />;
}

export function KalkulatorPageClient() {
  return <KalkulatorPageInner />;
}
