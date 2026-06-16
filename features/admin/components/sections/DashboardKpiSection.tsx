import {
  Activity,
  AlertTriangle,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { loadAdminDashboardKpis } from "@/features/admin/server/loadAdminDashboardKpis";
import { AdminKpiCard } from "@/features/admin/components/AdminKpiCard";
import { SectionHeader } from "@/features/admin/components/sections/AdminSectionsCommon";
import {
  formatAdminCount,
  formatAdminHours,
  roundMetric,
} from "@/features/admin/lib/formatAdminMetric";

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

function weekOverWeekDelta(
  current: number,
  previous: number,
  decimals = 0,
): { value: number; label: string; decimals: number } | null {
  if (current === 0 && previous === 0) return null;
  const delta = roundMetric(current - previous, decimals);
  return { value: delta, label: "vs poprz. tydz.", decimals };
}

export async function DashboardKpiSection() {
  const data = await loadAdminDashboardKpis();

  const peakHourLabel = data.peakHour
    ? `${formatHour(data.peakHour.hour)} (${formatAdminCount(data.peakHour.sessions)} sesji)`
    : "Brak danych";
  const peakDowLabel = data.peakDayOfWeek
    ? `${data.peakDayOfWeek.label} (${formatAdminCount(data.peakDayOfWeek.sessions)} sesji)`
    : "Brak danych";

  return (
    <section>
      <SectionHeader title="Najważniejsze liczby" subtitle="Stan na dziś" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          label="Użytkownicy"
          value={data.totalUsers}
          valueFormat="count"
          icon={Users}
          hint={`${formatAdminCount(data.paidUsers)} z aktywną subskrypcją`}
          delta={
            data.newRegistrationsLast7d > 0
              ? { value: data.newRegistrationsLast7d, label: "/ 7d" }
              : null
          }
        />
        <AdminKpiCard
          label="Aktywni (7 dni)"
          value={data.uniqueActiveUsersLast7d}
          valueFormat="count"
          icon={Activity}
          tone="sage"
          hint={`${formatAdminCount(data.uniqueActiveUsersLast30d)} aktywnych w 30 dniach`}
          delta={weekOverWeekDelta(
            data.uniqueActiveUsersLast7d,
            data.uniqueActiveUsersPrev7d,
          )}
        />
        <AdminKpiCard
          label="Sesje (7 dni)"
          value={data.sessionsLast7d}
          valueFormat="count"
          icon={Zap}
          tone="gold"
          hint={`${formatAdminCount(data.sessionsToday)} dzisiaj`}
          delta={weekOverWeekDelta(data.sessionsLast7d, data.sessionsPrev7d)}
        />
        <AdminKpiCard
          label="Odpowiedzi (7d)"
          value={data.answeredQuestionsLast7d}
          valueFormat="count"
          icon={BookOpen}
          hint={`${formatAdminCount(data.answeredQuestionsLast30d)} w 30 dniach`}
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
          value={data.studyHoursLast7d}
          valueFormat="hours"
          icon={Clock}
          tone="sage"
          hint={`${formatAdminHours(data.studyHoursLast30d)} w 30 dniach`}
          delta={weekOverWeekDelta(data.studyHoursLast7d, data.studyHoursPrev7d, 1)}
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
          valueFormat="count"
          icon={AlertTriangle}
          tone={data.pendingReports > 0 ? "warning" : "neutral"}
          hint="Wymagają reakcji admina"
        />
      </div>
    </section>
  );
}
