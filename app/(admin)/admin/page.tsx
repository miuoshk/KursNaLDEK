import { loadAdminDashboard } from "@/features/admin/server/loadAdminDashboard";
import { AdminMetricCard } from "@/features/admin/components/AdminMetricCard";

export default async function AdminDashboardPage() {
  const data = await loadAdminDashboard();

  return (
    <div>
      <h1 className="font-heading text-heading-xl text-primary">Panel admina</h1>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminMetricCard label="Łączna liczba pytań" value={data.totalQuestions} />
        <AdminMetricCard label="Łączna liczba użytkowników" value={data.totalUsers} />
        <AdminMetricCard
          label="Zgłoszenia do rozpatrzenia"
          value={data.pendingReports}
          highlight={data.pendingReports > 0}
        />
        <AdminMetricCard label="Sesje dzisiaj" value={data.sessionsToday} />
        {data.topUser && (
          <AdminMetricCard
            label="Najaktywniejszy użytkownik"
            value={`${data.topUser.displayName} (${data.topUser.sessionCount} sesji)`}
          />
        )}
      </div>
    </div>
  );
}
