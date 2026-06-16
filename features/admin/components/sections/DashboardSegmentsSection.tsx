import { loadAdminDashboardSegments } from "@/features/admin/server/loadAdminDashboardSegments";
import { AdminUserSegmentChart } from "@/features/admin/components/AdminUserSegmentChart";
import { SectionHeader } from "@/features/admin/components/sections/AdminSectionsCommon";

export async function DashboardSegmentsSection() {
  const segments = await loadAdminDashboardSegments();

  return (
    <section>
      <SectionHeader
        title="Użytkownicy — segmenty"
        subtitle="Kierunek + rok studiów · %Total = zarejestrowani / rocznik (LEK 288, STOMA 120)"
      />
      <div className="rounded-card border border-border bg-card p-5">
        <AdminUserSegmentChart segments={segments} />
      </div>
    </section>
  );
}
