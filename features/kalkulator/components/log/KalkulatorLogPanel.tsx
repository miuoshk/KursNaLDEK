"use client";

import { Suspense } from "react";
import { ProcedureLogScreen } from "@/features/kalkulator/components/log/ProcedureLogScreen";
import { usePracticeDashboard } from "@/features/kalkulator/hooks/usePracticeDashboard";
import type { Practice } from "@/features/kalkulator/types/practice";

function LogScreenInner({ practice }: { practice: Practice }) {
  const { procedures, materials, loading, error } = usePracticeDashboard(practice.id);

  if (loading) {
    return (
      <p className="font-body text-sm text-[color:var(--k-muted)]">Wczytywanie procedur…</p>
    );
  }

  if (error) {
    return (
      <p className="font-body text-sm text-[color:var(--k-margin-loss)]" role="alert">
        {error}
      </p>
    );
  }

  return (
    <Suspense
      fallback={
        <p className="font-body text-sm text-[color:var(--k-muted)]">Ładowanie…</p>
      }
    >
      <ProcedureLogScreen practice={practice} procedures={procedures} materials={materials} />
    </Suspense>
  );
}

export function KalkulatorLogPanel({ practice }: { practice: Practice }) {
  return (
    <Suspense
      fallback={
        <p className="font-body text-sm text-[color:var(--k-muted)]">Ładowanie…</p>
      }
    >
      <LogScreenInner practice={practice} />
    </Suspense>
  );
}
