"use client";

import { useEffect } from "react";
import { useDashboardBreadcrumb } from "@/features/shared/contexts/DashboardBreadcrumbContext";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { SummaryActions } from "@/features/session/components/SummaryActions";
import { SummaryAnswerStrip } from "@/features/session/components/SummaryAnswerStrip";
import { SummaryHero } from "@/features/session/components/SummaryHero";
import { SummaryTopicBreakdown } from "@/features/session/components/SummaryTopicBreakdown";
import { SummaryXpCard } from "@/features/session/components/SummaryXpCard";

export function SessionSummaryClient({ summary }: { summary: SessionSummaryData }) {
  const { setSecondSegment, setThirdSegment } = useDashboardBreadcrumb();

  useEffect(() => {
    setSecondSegment(summary.subjectName);
    setThirdSegment("Podsumowanie sesji");
    return () => {
      setSecondSegment(null);
      setThirdSegment(null);
    };
  }, [summary.subjectName, setSecondSegment, setThirdSegment]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 pb-12">
      <SummaryHero summary={summary} />
      <SummaryAnswerStrip summary={summary} />
      <SummaryTopicBreakdown summary={summary} />
      <SummaryXpCard summary={summary} />
      <SummaryActions summary={summary} />
    </div>
  );
}
