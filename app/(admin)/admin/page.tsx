import { loadAdminDashboard } from "@/features/admin/server/loadAdminDashboard";
import { AdminMetricCard } from "@/features/admin/components/AdminMetricCard";
import { AdminDailyTrendChart } from "@/features/admin/components/AdminDailyTrendChart";
import { AdminModeBenchmarkTable } from "@/features/admin/components/AdminModeBenchmarkTable";
import { AdminUserBenchmarkTable } from "@/features/admin/components/AdminUserBenchmarkTable";

export default async function AdminDashboardPage() {
  const data = await loadAdminDashboard();

  return (
    <div>
      <h1 className="font-heading text-heading-xl text-primary">Panel admina</h1>
      <p className="mt-2 font-body text-body-sm text-secondary">
        Benchmarki operacyjne: aktywność testów, jakość rozwiązywania i zaangażowanie użytkowników.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard label="Łączna liczba pytań" value={data.totalQuestions} />
        <AdminMetricCard label="Łączna liczba użytkowników" value={data.totalUsers} />
        <AdminMetricCard
          label="Zgłoszenia do rozpatrzenia"
          value={data.pendingReports}
          highlight={data.pendingReports > 0}
        />
        <AdminMetricCard label="Sesje dzisiaj" value={data.sessionsToday} />
        <AdminMetricCard label="Sesje (7 dni)" value={data.sessionsLast7d} />
        <AdminMetricCard label="Rozwiązane pytania (7 dni)" value={data.answeredQuestionsLast7d} />
        <AdminMetricCard label="Ukończone testy (7 dni)" value={data.completedTestsLast7d} />
        <AdminMetricCard label="Aktywni użytkownicy (7 dni)" value={data.uniqueActiveUsersLast7d} />
        <AdminMetricCard label="Czas nauki (7 dni)" value={`${data.studyHoursLast7d} h`} />
        <AdminMetricCard label="Śr. długość sesji (7 dni)" value={`${data.averageSessionMinutesLast7d} min`} />
        <AdminMetricCard label="Śr. poprawność (7 dni)" value={`${data.averageAccuracyLast7d}%`} />
        {data.topUser && (
          <AdminMetricCard
            label="Najaktywniejszy użytkownik"
            value={`${data.topUser.displayName} (${data.topUser.sessionCount} sesji)`}
          />
        )}
      </div>

      <section className="mt-8 rounded-card border border-border bg-card p-5">
        <h2 className="font-heading text-heading-md text-primary">Trend dzienny (14 dni)</h2>
        <p className="mt-1 font-body text-body-xs text-muted">
          Sesje, aktywni użytkownicy i liczba rozwiązanych pytań dzień po dniu.
        </p>
        <div className="mt-4">
          <AdminDailyTrendChart data={data.dailyTrendLast14d} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-heading-md text-primary">Jak użytkownicy rozwiązują testy (7 dni)</h2>
        <p className="mt-1 font-body text-body-xs text-muted">
          Podział po trybach z udziałem, średnią poprawnością i średnim czasem sesji.
        </p>
        <div className="mt-4">
          <AdminModeBenchmarkTable rows={data.modeBreakdownLast7d} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-heading-md text-primary">Top użytkownicy (30 dni)</h2>
        <p className="mt-1 font-body text-body-xs text-muted">
          Ranking aktywności i jakości nauki według sesji, czasu i skuteczności.
        </p>
        <div className="mt-4">
          <AdminUserBenchmarkTable rows={data.userBenchmarksLast30d} />
        </div>
      </section>
    </div>
  );
}
