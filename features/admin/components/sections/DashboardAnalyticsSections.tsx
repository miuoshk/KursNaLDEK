import {
  CreditCard,
  FileText,
  GraduationCap,
  UserPlus,
} from "lucide-react";
import { loadAdminDashboard } from "@/features/admin/server/loadAdminDashboard";
import { AdminHourDayHeatmap } from "@/features/admin/components/AdminHourDayHeatmap";
import { AdminHourOfDayChart } from "@/features/admin/components/AdminHourOfDayChart";
import { AdminDayOfWeekChart } from "@/features/admin/components/AdminDayOfWeekChart";
import { AdminDailyTrendChart } from "@/features/admin/components/AdminDailyTrendChart";
import { AdminSubjectsBarChart } from "@/features/admin/components/AdminSubjectsBarChart";
import { AdminTrackPerformanceChart } from "@/features/admin/components/AdminTrackPerformanceChart";
import { AdminEngagementCard } from "@/features/admin/components/AdminEngagementCard";
import { AdminSubscriptionDonut } from "@/features/admin/components/AdminSubscriptionDonut";
import { AdminRegistrationsTrendChart } from "@/features/admin/components/AdminRegistrationsTrendChart";
import { AdminModeBenchmarkTable } from "@/features/admin/components/AdminModeBenchmarkTable";
import { AdminUserBenchmarkTable } from "@/features/admin/components/AdminUserBenchmarkTable";
import { AdminCohortBenchmarkTable } from "@/features/admin/components/AdminCohortBenchmarkTable";
import { ChartCard, SectionHeader } from "@/features/admin/components/sections/AdminSectionsCommon";

export async function DashboardAnalyticsSections() {
  const data = await loadAdminDashboard();

  return (
    <>
      <section>
        <SectionHeader
          title="Kiedy się uczą"
          subtitle="Pora dnia i dzień tygodnia (ostatnie 30 dni)"
        />
        <div className="rounded-card border border-border bg-card p-5">
          <AdminHourDayHeatmap
            cells={data.heatmapLast30d}
            maxSessions={data.heatmapMaxSessions}
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ChartCard
            title="Godzina rozpoczęcia sesji"
            subtitle="Liczba sesji rozpoczętych w danej godzinie"
          >
            <AdminHourOfDayChart data={data.hourOfDayLast30d} />
          </ChartCard>
          <ChartCard
            title="Dzień tygodnia"
            subtitle="Sumaryczna aktywność według dnia"
          >
            <AdminDayOfWeekChart data={data.dayOfWeekLast30d} />
          </ChartCard>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Trend dzienny"
          subtitle="Sesje, aktywni użytkownicy i pytania w ostatnich 14 dniach"
        />
        <div className="rounded-card border border-border bg-card p-5">
          <AdminDailyTrendChart data={data.dailyTrendLast14d} />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Co najpopularniejsze"
          subtitle="Top 10 przedmiotów wg sesji (30 dni) — scalone po nazwie (LEK + STOMA)"
        />
        <div className="rounded-card border border-border bg-card p-5">
          <AdminSubjectsBarChart data={data.subjectPopularityLast30d} />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Wydajność kierunków"
          subtitle="Sesje vs. średnia poprawność po kierunku i roku (30 dni)"
        />
        <div className="rounded-card border border-border bg-card p-5">
          <AdminTrackPerformanceChart data={data.trackPerformanceLast30d} />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Zaangażowanie i monetyzacja"
          subtitle="Segmenty użytkowników oraz status subskrypcji"
        />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ChartCard
            title="Zaangażowanie (30 dni)"
            subtitle="Klasyfikacja na podstawie liczby sesji"
            icon={GraduationCap}
          >
            <AdminEngagementCard data={data.engagementLast30d} />
          </ChartCard>
          <ChartCard
            title="Subskrypcje"
            subtitle="Status w bazie profili"
            icon={CreditCard}
          >
            <AdminSubscriptionDonut data={data.subscriptionBreakdown} />
          </ChartCard>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Rejestracje"
          subtitle="Nowi użytkownicy dzień po dniu (30 dni)"
        />
        <ChartCard
          title={`${data.newRegistrationsLast30d} nowych użytkowników`}
          subtitle={`${data.newRegistrationsLast7d} w ostatnim tygodniu`}
          icon={UserPlus}
        >
          <AdminRegistrationsTrendChart data={data.registrationsLast30d} />
        </ChartCard>
      </section>

      <section>
        <SectionHeader
          title="Tryby nauki"
          subtitle="Jak użytkownicy rozwiązują testy w ostatnich 7 dniach"
        />
        <AdminModeBenchmarkTable rows={data.modeBreakdownLast7d} />
      </section>

      <section>
        <SectionHeader
          title="Kohorty: kierunek × rok"
          subtitle="Średni czas na platformie i % aktywnych subskrypcji (30 dni)"
        />
        <AdminCohortBenchmarkTable rows={data.cohortBenchmarksLast30d} />
      </section>

      <section>
        <SectionHeader
          title="Top użytkownicy"
          subtitle="Ranking aktywności i jakości w ciągu 30 dni — sortuj kolumnami, filtruj kierunkiem i rokiem"
          icon={FileText}
        />
        <AdminUserBenchmarkTable rows={data.userBenchmarksLast30d} />
      </section>
    </>
  );
}
