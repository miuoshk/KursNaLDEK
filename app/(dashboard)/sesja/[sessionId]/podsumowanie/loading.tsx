"use client";

import { useParams } from "next/navigation";
import { SessionSummaryClient } from "@/features/session/components/SessionSummaryClient";
import { readCachedSessionSummary } from "@/features/session/lib/sessionSummaryStorage";
import { Skeleton } from "@/features/shared/components/Skeleton";

export default function PodsumowanieLoading() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const summary = sessionId ? readCachedSessionSummary(sessionId) : null;

  if (summary) {
    return <SessionSummaryClient summary={summary} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      <Skeleton variant="card" className="h-48 w-full border-t-[3px] border-brand-gold/30" />
      <Skeleton variant="card" className="h-40 w-full" />
      <Skeleton variant="card" className="h-32 w-full" />
    </div>
  );
}
