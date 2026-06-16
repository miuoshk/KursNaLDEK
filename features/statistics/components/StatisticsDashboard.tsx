"use client";

import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { ActivityHeatmap } from "@/features/statistics/components/ActivityHeatmap";
import { AccuracyTrendChart } from "@/features/statistics/components/AccuracyTrendChart";
import { ExamCountdown } from "@/features/statistics/components/ExamCountdown";
import { ReadinessCard } from "@/features/statistics/components/ReadinessCard";
import { StudyTimeChart } from "@/features/statistics/components/StudyTimeChart";
import { SubjectRadarChart } from "@/features/statistics/components/SubjectRadarChart";
import { WeakTopicsList } from "@/features/statistics/components/WeakTopicsList";
import { SessionHistoryList } from "@/features/shared/components/SessionHistoryList";
import type { StatisticsPayload, TimeRangeKey } from "@/features/statistics/types";
import { cn } from "@/lib/utils";

const RANGES: TimeRangeKey[] = ["7", "30", "90", "all"];

export function StatisticsDashboard({ data }: { data: StatisticsPayload }) {
  const t = useTranslations("statistics");
  const router = useRouter();
  const searchParams = useSearchParams();

  if (data.totalQuestionsAnswered === 0) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
            {t("page.title")}
          </h1>
          <p className="mt-1 font-body text-sm text-secondary">
            {t("page.subtitle")}
          </p>
        </header>
        <EmptyState
          icon={BarChart3}
          title={t("empty.title")}
          description={t("empty.description")}
          cta={{ href: "/przedmioty", label: t("empty.cta") }}
        />
      </div>
    );
  }

  const setRange = (key: TimeRangeKey) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("range", key);
    router.push(`/statystyki?${p.toString()}`);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
            {t("page.title")}
          </h1>
          <p className="mt-1 font-body text-sm text-secondary">
            {t("page.subtitle")}
          </p>
        </div>
        <div className="inline-flex rounded-pill bg-card p-1">
          {RANGES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={cn(
                "rounded-pill px-4 py-2 font-body text-body-sm transition duration-200 ease-out",
                data.range === key
                  ? "bg-brand-gold text-brand-bg"
                  : "text-secondary hover:text-primary",
              )}
            >
              {t(`ranges.${key}`)}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ReadinessCard data={data} />
        <ExamCountdown />
        <div className="rounded-card bg-card p-6">
          <p className="font-body text-body-xs font-medium uppercase tracking-wide text-secondary">
            {t("activity.title")}
          </p>
          <div className="mt-4">
            <ActivityHeatmap cells={data.heatmap} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-card bg-card p-6">
          <h2 className="font-heading text-xl font-bold text-primary">
            {t("mastery.title")}
          </h2>
          <div className="mt-4">
            <SubjectRadarChart data={data} />
          </div>
        </section>
        <section className="rounded-card bg-card p-6">
          <h2 className="font-heading text-xl font-bold text-primary">
            {t("studyTime.title")}
          </h2>
          <div className="mt-4">
            <StudyTimeChart data={data} />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-card bg-card p-6">
          <h2 className="font-heading text-xl font-bold text-primary">
            {t("accuracyTrend.title")}
          </h2>
          <div className="mt-4">
            <AccuracyTrendChart data={data} />
          </div>
        </section>
        <section className="rounded-card bg-card p-6">
          <h2 className="font-heading text-xl font-bold text-primary">
            {t("weakTopics.title")}
          </h2>
          <div className="mt-4">
            <WeakTopicsList data={data} />
          </div>
        </section>
      </div>

      <section>
        <h2 className="font-heading text-xl font-bold text-primary">
          {t("sessionHistory.title")}
        </h2>
        <p className="mt-1 font-body text-sm text-secondary">
          {t("sessionHistory.subtitle")}
        </p>
        <div className="mt-4">
          <SessionHistoryList
            sessions={data.recentSessions}
            emptyText={t("sessionHistory.empty")}
            emptyAction={{ href: "/przedmioty", label: t("sessionHistory.startSession") }}
          />
        </div>
      </section>

      <p className="font-body text-body-xs text-muted">
        {t("footer", {
          questions: data.totalQuestionsAnswered,
          minutes: Math.round(data.totalStudyMinutes),
          xp: data.xp,
          streak: data.currentStreak,
        })}
      </p>
    </div>
  );
}
