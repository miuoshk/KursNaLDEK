import {
  loadAdminUsers,
  loadAdminUserFacets,
  type AdminUserRole,
  type AdminUserTrack,
} from "@/features/admin/server/loadAdminUsers";
import { getAdminAccessContext } from "@/features/admin/server/adminAuth";
import { AdminUsersTable } from "@/features/admin/components/AdminUsersTable";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    role?: string;
    track?: string;
    year?: string;
  }>;
};

function normalizeRoleParam(value: string | undefined): AdminUserRole | "" {
  if (value === "admin" || value === "moderator" || value === "student") {
    return value;
  }
  return "";
}

function normalizeTrackParam(value: string | undefined): AdminUserTrack {
  if (value === "lekarski" || value === "stomatologia" || value === "inny") {
    return value;
  }
  return "";
}

function normalizeYearParam(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= 10 ? n : null;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.q?.trim() ?? "";
  const role = normalizeRoleParam(sp.role);
  const track = normalizeTrackParam(sp.track);
  const year = normalizeYearParam(sp.year);

  const [ctx, users, facets] = await Promise.all([
    getAdminAccessContext(),
    loadAdminUsers({ search, role, track, year }),
    loadAdminUserFacets(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-[32px] leading-[1.15] text-primary sm:text-[40px]">
        Użytkownicy
      </h1>
      <p className="mt-3 font-body text-body-md text-secondary">
        Zarządzaj rolami i filtruj listę po kierunku oraz roku studiów. Zmiana ról
        wymaga roli <span className="text-brand-gold">admin</span>.
      </p>

      <AdminUsersTable
        users={users}
        currentUserId={ctx.user?.id ?? ""}
        canEditRoles={ctx.role === "admin"}
        currentSearch={search}
        currentRole={role}
        currentTrack={track}
        currentYear={year}
        availableTracks={facets.tracks}
        availableYears={facets.years}
      />
    </div>
  );
}
