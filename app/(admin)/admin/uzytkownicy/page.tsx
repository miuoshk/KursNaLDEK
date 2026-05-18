import { loadAdminUsers, type AdminUserRole } from "@/features/admin/server/loadAdminUsers";
import { getAdminAccessContext } from "@/features/admin/server/adminAuth";
import { AdminUsersTable } from "@/features/admin/components/AdminUsersTable";

type PageProps = {
  searchParams: Promise<{ q?: string; role?: string }>;
};

function normalizeRoleParam(value: string | undefined): AdminUserRole | "" {
  if (value === "admin" || value === "moderator" || value === "student") {
    return value;
  }
  return "";
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.q?.trim() ?? "";
  const role = normalizeRoleParam(sp.role);

  const ctx = await getAdminAccessContext();
  const users = await loadAdminUsers({ search, role });

  return (
    <div>
      <h1 className="font-heading text-heading-xl text-primary">Użytkownicy</h1>
      <p className="mt-2 font-body text-body-sm text-secondary">
        Zarządzaj rolami: nadawaj uprawnienia admina lub moderatora.
        Zmiana ról wymaga roli <span className="text-brand-gold">admin</span>.
      </p>

      <AdminUsersTable
        users={users}
        currentUserId={ctx.user?.id ?? ""}
        canEditRoles={ctx.role === "admin"}
        currentSearch={search}
        currentRole={role}
      />
    </div>
  );
}
