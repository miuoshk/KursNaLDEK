"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ResetSubjectProgress } from "@/features/subjects/components/ResetSubjectProgress";
import { SmartSessionCTA } from "@/features/subjects/components/SmartSessionCTA";
import { StatsRow } from "@/features/subjects/components/StatsRow";
import { TopicGrid } from "@/features/subjects/components/TopicGrid";
import type {
  SubjectStats,
  TopicWithProgress,
} from "@/features/subjects/server/loadSubjectDashboard";
import type { SourceAccuracyBreakdown } from "@/features/session/lib/sourceAccuracy";
import type { Subject } from "@/features/subjects/types";
import { SourceBankPills } from "@/features/shared/components/SourceBankPills";
import { SourceFilterBar } from "@/features/shared/components/SourceFilter";
import { SourceAccuracyCard } from "@/features/shared/components/SourceAccuracyCard";
import { useSubjectSourceFilter } from "@/features/shared/hooks/useSubjectSourceFilter";
import {
  sourceBankCemCount,
  sourceBankOwnCount,
  shouldShowSourceBankPills,
} from "@/features/shared/lib/sourceBankPills";
import {
  countForSource,
  isSourceFilterUiEnabled,
  type SourceFilterCounts,
} from "@/features/session/lib/sourceFilter";
import type { DailyStudyPlan } from "@/features/session/lib/dailyPlan";
import type { ExamReadinessSnapshot } from "@/features/session/summaryTypes";
import { ExamReadinessCard } from "@/features/session/components/ExamReadinessCard";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { emptyRycinaId } from "@/features/shared/lib/rycinaCatalog";
import { BookOpen } from "lucide-react";

type Props = {
  subject: Subject;
  topics: TopicWithProgress[];
  stats: SubjectStats;
  sourceCounts: SourceFilterCounts | null;
  statsBySource: Record<"all" | "reference" | "own", SubjectStats> | null;
  sourceAccuracy: SourceAccuracyBreakdown | null;
  initialSessionCount: number;
  profileDefaultSource?: string | null;
  dailyPlan: DailyStudyPlan | null;
  examReadiness?: ExamReadinessSnapshot | null;
};

export function SubjectDashboardClient({
  subject,
  topics,
  stats,
  sourceCounts,
  statsBySource,
  sourceAccuracy,
  initialSessionCount,
  profileDefaultSource,
  dailyPlan,
  examReadiness,
}: Props) {
  const t = useTranslations("subjects");
  const enabled = isSourceFilterUiEnabled(subject.product);
  const showBankPills = shouldShowSourceBankPills(subject.product);
  const { source, setSource } = useSubjectSourceFilter({
    product: subject.product,
    profileDefault: profileDefaultSource,
    enabled,
  });

  const availableQuestionCount = useMemo(() => {
    if (!enabled || !sourceCounts) return stats.totalQuestions;
    return countForSource(sourceCounts, source);
  }, [enabled, source, sourceCounts, stats.totalQuestions]);

  const displayStats = useMemo(() => {
    if (!enabled || !statsBySource) return stats;
    return statsBySource[source];
  }, [enabled, source, stats, statsBySource]);

  return (
    <>
      {showBankPills ? (
        <div className="mt-5">
          <SourceBankPills
            product={subject.product}
            ownCount={sourceBankOwnCount(sourceCounts, stats.totalQuestions)}
            cemCount={sourceBankCemCount(sourceCounts)}
          />
        </div>
      ) : enabled && sourceCounts ? (
        <div className="mt-5">
          <SourceFilterBar
            product={subject.product}
            value={source}
            onChange={setSource}
            counts={sourceCounts}
          />
        </div>
      ) : null}

      <div className="mt-8 space-y-8">
        <StatsRow stats={displayStats} />

        {examReadiness ? (
          <ExamReadinessCard readiness={examReadiness} />
        ) : null}

        {enabled && sourceAccuracy ? (
          <SourceAccuracyCard product={subject.product} data={sourceAccuracy} />
        ) : null}

        {stats.totalQuestions > 0 || availableQuestionCount > 0 ? (
          <SmartSessionCTA
            subjectId={subject.id}
            product={subject.product}
            source={enabled ? source : undefined}
            sourceCounts={enabled ? sourceCounts : null}
            availableQuestionCount={availableQuestionCount}
            initialSessionCount={initialSessionCount}
            dueCount={
              !enabled || source === "all"
                ? (dailyPlan?.dueBacklog ?? displayStats.dueCount)
                : displayStats.dueCount
            }
            dailyPlan={dailyPlan}
          />
        ) : (
          <EmptyState
            icon={BookOpen}
            rycinaId={emptyRycinaId("session")}
            title={t("noQuestionsInSubject")}
          />
        )}
        <TopicGrid
          topics={topics}
          subjectId={subject.id}
          subjectShortName={subject.short_name}
          product={subject.product}
          source={enabled ? source : "all"}
          sourceEnabled={enabled}
          subjectSourceCounts={sourceCounts}
          initialSessionCount={initialSessionCount}
        />

        <div className="flex justify-end pt-4">
          <ResetSubjectProgress
            subjectId={subject.id}
            subjectName={subject.name}
          />
        </div>
      </div>
    </>
  );
}
