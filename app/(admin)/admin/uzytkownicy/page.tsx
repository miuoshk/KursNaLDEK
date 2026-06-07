import {
  loadAdminUsers,
  loadAdminUserFacets,
  type AdminUserRole,
  type AdminUserSortBy,
  type AdminUserSortDir,
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
    sortBy?: string;
    sortDir?: string;
  }>;
};

const VALID_SORT_BY: AdminUserSortBy[] = [
  "displayName",
  "email",
  "role",
  "track",
  "currentYear",
  "subscriptionStatus",
  "createdAt",
  "lastSignInAt",
];

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

function normalizeSortBy(value: string | undefined): AdminUserSortBy {
  return VALID_SORT_BY.includes(value as AdminUserSortBy)
    ? (value as AdminUserSortBy)
    : "createdAt";
}

function normalizeSortDir(value: string | undefined): AdminUserSortDir {
  return value === "asc" ? "asc" : "desc";
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.q?.trim() ?? "";
  const role = normalizeRoleParam(sp.role);
  const track = normalizeTrackParam(sp.track);
  const year = normalizeYearParam(sp.year);
  const sortBy = normalizeSortBy(sp.sortBy);
  const sortDir = normalizeSortDir(sp.sortDir);

  const [ctx, users, facets] = await Promise.all([
    getAdminAccessContext(),
    loadAdminUsers({ search, role, track, year, sortBy, sortDir }),
    loadAdminUserFacets(),
  ]);

  return (
    <div>
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          Użytkownicy
        </h1>
        <p className="mt-1 font-body text-sm text-secondary">
          Zarządzaj rolami, banami, odbiorem dostępu i filtruj listę po kierunku oraz roku studiów.
          Zmiana ról, banowanie i odbiór dostępu wymaga roli{" "}
          <span className="text-brand-gold">admin</span>.
        </p>
      </header>

      <AdminUsersTable
        users={users}
        currentUserId={ctx.user?.id ?? ""}
        canEditRoles={ctx.role === "admin"}
        currentSearch={search}
        currentRole={role}
        currentTrack={track}
        currentYear={year}
        currentSortBy={sortBy}
        currentSortDir={sortDir}
        availableTracks={facets.tracks}
        availableYears={facets.years}
      />
    </div>
  );
}
