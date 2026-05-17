import { AdminDiscussionsTable } from "@/features/admin/components/AdminDiscussionsTable";
import { loadAdminDiscussions } from "@/features/admin/server/loadAdminDiscussions";

type PageProps = {
  searchParams: Promise<{ search?: string }>;
};

export default async function AdminDiscussionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rows = await loadAdminDiscussions({ search: sp.search });

  return (
    <div>
      <h1 className="font-heading text-heading-xl text-primary">Dyskusje pod pytaniami</h1>
      <AdminDiscussionsTable rows={rows} currentSearch={sp.search} />
    </div>
  );
}
