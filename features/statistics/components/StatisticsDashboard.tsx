"use client";

import { BarChart3 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { ActivityHeatmap } from "@/features/statistics/components/ActivityHeatmap";
import { AccuracyTrendChart } from "@/features/statistics/components/AccuracyTrendChart";
import { ExamCountdown } from "@/features/statistics/components/ExamCountdown";
import { ReadinessCard } from "@/features/statistics/components/ReadinessCard";
import { StudyTimeChart } from "@/features/statistics/components/StudyTimeChart";
import { SubjectRadarChart } from "@/features/statistics/components/SubjectRadarChart";
import { WeakTopicsList } from "@/features/statistics/components/WeakTopicsList";
import type { StatisticsPayload, TimeRangeKey } from "@/features/statistics/types";
import { cn } from "@/lib/utils";

const RANGES: { key: TimeRangeKey; label: string }[] = [
  { key: "7", label: "7 dni" },
  { key: "30", label: "30 dni" },
  { key: "90", label: "90 dni" },
  { key: "all", label: "Wszystko" },
];

export function StatisticsDashboard({ data }: { data: StatisticsPayload }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (data.totalQuestionsAnswered === 0) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="font-heading text-heading-xl text-primary">Statystyki</h1>
          <p className="mt-2 font-body text-body-md text-secondary">
            Analiza postępów i predykcja wyniku końcowego
          </p>
        </div>
        <EmptyState
          icon={BarChart3}
          title="Brak danych do wyświetlenia"
          description="Odpowiedz na pytania, a tutaj pojawią się Twoje statystyki."
          cta={{ href: "/przedmioty", label: "Rozpocznij pierwszą sesję →" }}
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
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl text-primary">Statystyki</h1>
          <p className="mt-2 font-body text-body-md text-secondary">
            Analiza postępów i predykcja wyniku końcowego
          </p>
        </div>
        <div className="inline-flex rounded-pill bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-pill px-4 py-2 font-body text-body-sm transition duration-200 ease-out",
                data.range === r.key
                  ? "bg-brand-gold text-brand-bg"
                  : "text-secondary hover:text-primary",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ReadinessCard data={data} />
        <ExamCountdown />
        <div className="rounded-card bg-card p-6">
          <p className="font-body text-body-xs font-medium uppercase tracking-wide text-secondary">
            Aktywność (30 dni)
          </p>
          <div className="mt-4">
            <ActivityHeatmap cells={data.heatmap} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-card bg-card p-6">
          <h2 className="font-heading text-heading-sm text-primary">
            Opanowanie dziedzin
          </h2>
          <div className="mt-4">
            <SubjectRadarChart data={data} />
          </div>
        </section>
        <section className="rounded-card bg-card p-6">
          <h2 className="font-heading text-heading-sm text-primary">
            Czas nauki (godziny)
          </h2>
          <div className="mt-4">
            <StudyTimeChart data={data} />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-card bg-card p-6">
          <h2 className="font-heading text-heading-sm text-primary">
            Trend poprawności (30 dni)
          </h2>
          <div className="mt-4">
            <AccuracyTrendChart data={data} />
          </div>
        </section>
        <section className="rounded-card bg-card p-6">
          <h2 className="font-heading text-heading-sm text-primary">
            Słabe ogniwa (top 5)
          </h2>
          <div className="mt-4">
            <WeakTopicsList data={data} />
          </div>
        </section>
      </div>

      <p className="font-body text-body-xs text-muted">
        Łącznie pytań w wybranym okresie: {data.totalQuestionsAnswered} · Czas nauki:{" "}
        {Math.round(data.totalStudyMinutes)} min · XP: {data.xp} · Streak:{" "}
        {data.currentStreak} dni
      </p>
    </div>
  );
}
