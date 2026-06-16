"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { loadSessionSummaryAction } from "@/features/session/api/loadSessionSummary";
import { SessionSummaryClient } from "@/features/session/components/SessionSummaryClient";
import { sessionSummaryStorageKey } from "@/features/session/lib/sessionSummaryStorage";
import { Skeleton } from "@/features/shared/components/Skeleton";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

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
  const t = useTranslations("session");
  const [summary, setSummary] = useState<SessionSummaryData | null>(() =>
    readCachedSummary(sessionId),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (summary) return;

    void loadSessionSummaryAction(sessionId).then((r) => {
      if (r.ok) setSummary(r.summary);
      else setError(r.message);
    });
  }, [sessionId, summary]);

  useEffect(() => {
    if (error) router.replace("/przedmioty");
  }, [error, router]);

  if (error) {
    return (
      <p className="font-body text-body-sm text-muted">
        {t("redirecting")}
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
