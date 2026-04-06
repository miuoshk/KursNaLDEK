"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSessionSummaryAction } from "@/features/session/api/loadSessionSummary";
import { SessionSummaryClient } from "@/features/session/components/SessionSummaryClient";
import { Skeleton } from "@/features/shared/components/Skeleton";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

const storageKey = (id: string) => `session-summary-${id}`;

export function SessionSummaryLoader({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw =
      typeof window !== "undefined" ? sessionStorage.getItem(storageKey(sessionId)) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SessionSummaryData;
        setSummary(parsed);
        return;
      } catch {
        sessionStorage.removeItem(storageKey(sessionId));
      }
    }

    void loadSessionSummaryAction(sessionId).then((r) => {
      if (r.ok) setSummary(r.summary);
      else setError(r.message);
    });
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
        <Skeleton variant="text" className="h-10 w-64" />
        <Skeleton variant="card" className="h-48 w-full" />
        <Skeleton variant="card" className="h-32 w-full" />
      </div>
    );
  }

  return <SessionSummaryClient summary={summary} />;
}
