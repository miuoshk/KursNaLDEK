import {
  Activity,
  AlertTriangle,
  BookOpen,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  TrendingUp,
  Users,
  UserPlus,
  Zap,
} from "lucide-react";
import { loadAdminDashboard } from "@/features/admin/server/loadAdminDashboard";
import { AdminKpiCard } from "@/features/admin/components/AdminKpiCard";
import { AdminUserSegmentChart } from "@/features/admin/components/AdminUserSegmentChart";
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

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

function weekOverWeekDelta(current: number, previous: number): { value: number; label: string } | null {
  if (current === 0 && previous === 0) return null;
  const delta = current - previous;
  return { value: delta, label: "vs poprz. tydz." };
}

export async function DashboardSections() {
  const data = await loadAdminDashboard();

  const peakHourLabel = data.peakHour
    ? `${formatHour(data.peakHour.hour)} (${data.peakHour.sessions} sesji)`
    : "Brak danych";
  const peakDowLabel = data.peakDayOfWeek
    ? `${data.peakDayOfWeek.label} (${data.peakDayOfWeek.sessions} sesji)`
    : "Brak danych";

  return (
    <>
      <section>
        <SectionHeader title="Najważniejsze liczby" subtitle="Stan na dziś" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminKpiCard
            label="Użytkownicy"
            value={data.totalUsers}
            icon={Users}
            hint={`${data.paidUsers} z aktywną subskrypcją`}
            delta={
              data.newRegistrationsLast7d > 0
                ? { value: data.newRegistrationsLast7d, label: "/ 7d" }
                : null
            }
          />
          <AdminKpiCard
            label="Aktywni (7 dni)"
            value={data.uniqueActiveUsersLast7d}
            icon={Activity}
            tone="sage"
            hint={`${data.uniqueActiveUsersLast30d} aktywnych w 30 dniach`}
            delta={weekOverWeekDelta(
              data.uniqueActiveUsersLast7d,
              data.uniqueActiveUsersPrev7d,
            )}
          />
          <AdminKpiCard
            label="Sesje (7 dni)"
            value={data.sessionsLast7d}
            icon={Zap}
            tone="gold"
            hint={`${data.sessionsToday} dzisiaj`}
            delta={weekOverWeekDelta(data.sessionsLast7d, data.sessionsPrev7d)}
          />
          <AdminKpiCard
            label="Odpowiedzi (7d)"
            value={data.answeredQuestionsLast7d}
            icon={BookOpen}
            hint={`${data.answeredQuestionsLast30d} w 30 dniach`}
            delta={weekOverWeekDelta(
              data.answeredQuestionsLast7d,
              data.answeredQuestionsPrev7d,
            )}
          />
          <AdminKpiCard
            label="Śr. poprawność (7d)"
            value={`${data.averageAccuracyLast7d}%`}
            icon={TrendingUp}
            tone={
              data.averageAccuracyLast7d >= 70
                ? "success"
                : data.averageAccuracyLast7d < 50
                  ? "error"
                  : "neutral"
            }
            hint={`${data.averageAccuracyLast30d}% w 30 dniach`}
          />
          <AdminKpiCard
            label="Czas nauki (7d)"
            value={`${data.studyHoursLast7d} h`}
            icon={Clock}
            tone="sage"
            hint={`${data.studyHoursLast30d} h w 30 dniach`}
            delta={weekOverWeekDelta(data.studyHoursLast7d, data.studyHoursPrev7d)}
          />
          <AdminKpiCard
            label="Szczyt aktywności"
            value={peakHourLabel}
            icon={Calendar}
            tone="gold"
            hint={`Dzień: ${peakDowLabel}`}
          />
          <AdminKpiCard
            label="Zgłoszenia do rozpatrzenia"
            value={data.pendingReports}
            icon={AlertTriangle}
            tone={data.pendingReports > 0 ? "warning" : "neutral"}
            hint="Wymagają reakcji admina"
          />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Użytkownicy — segmenty"
          subtitle="Kto siedzi w platformie: kierunek + rok studiów"
        />
        <div className="rounded-card border border-border bg-card p-5">
          <AdminUserSegmentChart segments={data.userSegments} />
        </div>
      </section>

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
          subtitle="Top 10 przedmiotów według liczby sesji (30 dni)"
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
          subtitle="Średni czas na platformie, na testach i % aktywnych subskrypcji (30 dni)"
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
