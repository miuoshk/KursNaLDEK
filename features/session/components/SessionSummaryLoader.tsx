"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { loadSessionSummaryAction } from "@/features/session/api/loadSessionSummary";
import { SessionSummaryClient } from "@/features/session/components/SessionSummaryClient";
import {
  readCachedSessionSummary,
  subscribeSessionSummary,
} from "@/features/session/lib/sessionSummaryStorage";
import { Skeleton } from "@/features/shared/components/Skeleton";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

const RETRY_INTERVAL_MS = 500;
const RETRY_MAX_ATTEMPTS = 10;

function SummarySkeletons() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      <Skeleton variant="card" className="h-48 w-full border-t-[3px] border-brand-gold/30" />
      <Skeleton variant="card" className="h-40 w-full" />
      <Skeleton variant="card" className="h-32 w-full" />
    </div>
  );
}

export function SessionSummaryLoader({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const t = useTranslations("session");
  const [summary, setSummary] = useState<SessionSummaryData | null>(() =>
    readCachedSessionSummary(sessionId),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (summary) return;
    return subscribeSessionSummary(sessionId, setSummary);
  }, [sessionId, summary]);

  useEffect(() => {
    if (summary) return;

    let cancelled = false;
    let attempts = 0;
    let timeoutId: number | undefined;

    const tick = async () => {
      if (cancelled) return;

      const cached = readCachedSessionSummary(sessionId);
      if (cached) {
        setSummary(cached);
        return;
      }

      const result = await loadSessionSummaryAction(sessionId);
      if (cancelled) return;
      if (result.ok) {
        setSummary(result.summary);
        return;
      }

      attempts += 1;
      if (attempts >= RETRY_MAX_ATTEMPTS) {
        setError(result.message);
        return;
      }
      timeoutId = window.setTimeout(() => void tick(), RETRY_INTERVAL_MS);
    };

    void tick();
    return () => {
      cancelled = true;
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
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
    return <SummarySkeletons />;
  }

  return <SessionSummaryClient summary={summary} />;
}
