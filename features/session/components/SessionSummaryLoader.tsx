"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSessionSummaryAction } from "@/features/session/api/loadSessionSummary";
import { SessionSummaryClient } from "@/features/session/components/SessionSummaryClient";
import { sessionSummaryStorageKey } from "@/features/session/lib/sessionSummaryStorage";
import { Skeleton } from "@/features/shared/components/Skeleton";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

// Inicjalny odczyt sessionStorage robimy synchronicznie w `useState` initializer,
// zeby pierwszy render zawieral juz pelne podsumowanie (gdy klient przyszedl
// tu prosto z ekranu sesji - dane sa w storage). Eliminuje to flash skeletonu
// miedzy router.replace a hydratacja danych.
function readCachedSummary(sessionId: string): SessionSummaryData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(sessionSummaryStorageKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as SessionSummaryData;
  } catch {
    return null;
  }
}

export function SessionSummaryLoader({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<SessionSummaryData | null>(() =>
    readCachedSummary(sessionId),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cache hit - czyscimy go (jednorazowy uzytek) i konczymy.
    if (summary) {
      try {
        sessionStorage.removeItem(sessionSummaryStorageKey(sessionId));
      } catch { /* SSR / quota */ }
      return;
    }

    void loadSessionSummaryAction(sessionId).then((r) => {
      if (r.ok) setSummary(r.summary);
      else setError(r.message);
    });
    // intencjonalnie tylko sessionId - summary z initializer'a jest stabilne
    // i nie chcemy retriggerowac fetchu po jego ustawieniu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (error) router.replace("/przedmioty");
  }, [error, router]);

  if (error) {
    return (
      <p className="font-body text-body-sm text-muted">
        Przekierowanie…
      </p>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-4">
        <Skeleton variant="card" className="h-48 w-full border-t-[3px] border-brand-gold/30" />
        <Skeleton variant="card" className="h-40 w-full" />
        <Skeleton variant="card" className="h-32 w-full" />
      </div>
    );
  }

  return <SessionSummaryClient summary={summary} />;
}
