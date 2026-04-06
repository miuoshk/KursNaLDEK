import { loadAdminReports } from "@/features/admin/server/loadAdminReports";
import { AdminReportsTable } from "@/features/admin/components/AdminReportsTable";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const reports = await loadAdminReports({ status: sp.status });

  return (
    <div>
      <h1 className="font-heading text-heading-xl text-primary">Zgłoszenia błędów</h1>
      <AdminReportsTable reports={reports} currentStatus={sp.status} />
    </div>
  );
}
