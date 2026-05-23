"use client";

import { useEffect, useState } from "react";
import { useDashboardBreadcrumb } from "@/features/shared/contexts/DashboardBreadcrumbContext";
import { loadSessionAntaresInsights } from "@/features/session/api/loadSessionAntaresInsights";
import { SummaryActions } from "@/features/session/components/SummaryActions";
import { SummaryAnswerStrip } from "@/features/session/components/SummaryAnswerStrip";
import { SummaryHero } from "@/features/session/components/SummaryHero";
import { SummaryInsightsSection } from "@/features/session/components/SummaryInsightsSection";
import { SummaryTopicBreakdown } from "@/features/session/components/SummaryTopicBreakdown";
import { SummaryXpCard } from "@/features/session/components/SummaryXpCard";
import { sessionSummaryStorageKey } from "@/features/session/lib/sessionSummaryStorage";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 8;

export function SessionSummaryClient({
  summary: initialSummary,
}: {
  summary: SessionSummaryData;
}) {
  const { setSecondSegment, setThirdSegment } = useDashboardBreadcrumb();
  const [summary, setSummary] = useState(initialSummary);
  const [insightsLoading, setInsightsLoading] = useState(
    initialSummary.mode === "inteligentna" &&
      !initialSummary.sessionInsights &&
      !initialSummary.examReadiness,
  );

  useEffect(() => {
    setSecondSegment(summary.subjectName);
    setThirdSegment("Podsumowanie sesji");
    return () => {
      setSecondSegment(null);
      setThirdSegment(null);
    };
  }, [summary.subjectName, setSecondSegment, setThirdSegment]);

  useEffect(() => {
    try {
      sessionStorage.removeItem(`kurs-session-${summary.sessionId}`);
      const t = setTimeout(() => {
        try {
          sessionStorage.removeItem(`session_${summary.sessionId}_completed`);
          sessionStorage.removeItem(sessionSummaryStorageKey(summary.sessionId));
        } catch {
          /* SSR guard */
        }
      }, 30_000);
      return () => clearTimeout(t);
    } catch {
      /* SSR guard */
    }
  }, [summary.sessionId]);

  useEffect(() => {
    if (summary.mode !== "inteligentna") return;
    if (summary.sessionInsights || summary.examReadiness) {
      setInsightsLoading(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;
      const res = await loadSessionAntaresInsights(summary.sessionId);
      if (cancelled) return;

      if (res.ok && res.ready) {
        setSummary((prev) => {
          const next = {
            ...prev,
            sessionInsights: res.sessionInsights ?? prev.sessionInsights,
            examReadiness: res.examReadiness ?? prev.examReadiness,
          };
          try {
            sessionStorage.setItem(
              sessionSummaryStorageKey(summary.sessionId),
              JSON.stringify(next),
            );
          } catch {
            /* quota */
          }
          return next;
        });
        setInsightsLoading(false);
        return;
      }

      if (attempts >= POLL_MAX_ATTEMPTS) {
        setInsightsLoading(false);
        return;
      }

      window.setTimeout(() => void poll(), POLL_INTERVAL_MS);
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [
    summary.sessionId,
    summary.mode,
    summary.sessionInsights,
    summary.examReadiness,
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 pb-12">
      <SummaryHero summary={summary} />
      <SummaryInsightsSection summary={summary} loading={insightsLoading} />
      <SummaryAnswerStrip summary={summary} />
      <SummaryTopicBreakdown summary={summary} />
      <SummaryXpCard summary={summary} />
      <SummaryActions summary={summary} />
    </div>
  );
}
