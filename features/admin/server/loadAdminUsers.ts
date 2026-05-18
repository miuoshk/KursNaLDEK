import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUserRole = "admin" | "moderator" | "student";

export type AdminUserRow = {
  id: string;
  displayName: string;
  fullName: string | null;
  email: string | null;
  role: AdminUserRole;
  createdAt: string | null;
  lastSignInAt: string | null;
  currentYear: number | null;
  subscriptionStatus: string | null;
};

function normalizeRole(value: unknown): AdminUserRole {
  if (value === "admin" || value === "moderator") return value;
  return "student";
}

/**
 * Zwraca listę użytkowników do widoku /admin/uzytkownicy.
 *
 * - profiles czyta zwykłym klientem (RLS pozwala adminowi/moderatorowi),
 * - emaile + last_sign_in_at pobiera service role (auth.users nie jest dostępne przez RLS).
 */
export async function loadAdminUsers(params?: {
  search?: string;
  role?: AdminUserRole | "";
}): Promise<AdminUserRow[]> {
  const supabase = await createClient();

  const { data: profileRows, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, full_name, role, created_at, current_year, subscription_status",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[loadAdminUsers]", error.message);
    return [];
  }

  const emailMap = new Map<string, { email: string | null; lastSignInAt: string | null }>();

  try {
    const admin = createAdminClient();
    let page = 1;
    const perPage = 200;
    while (page <= 10) {
      const { data, error: authError } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (authError) {
        console.error("[loadAdminUsers] auth.listUsers", authError.message);
        break;
      }
      const users = data?.users ?? [];
      for (const u of users) {
        emailMap.set(u.id, {
          email: u.email ?? null,
          lastSignInAt: u.last_sign_in_at ?? null,
        });
      }
      if (users.length < perPage) break;
      page += 1;
    }
  } catch (e) {
    console.error("[loadAdminUsers] admin client error", e);
  }

  const rows: AdminUserRow[] = (profileRows ?? []).map((r) => {
    const auth = emailMap.get(r.id as string);
    return {
      id: r.id as string,
      displayName: ((r.display_name as string | null) ?? "").trim() || "Bez nazwy",
      fullName: (r.full_name as string | null) ?? null,
      email: auth?.email ?? null,
      role: normalizeRole(r.role),
      createdAt: (r.created_at as string | null) ?? null,
      lastSignInAt: auth?.lastSignInAt ?? null,
      currentYear: (r.current_year as number | null) ?? null,
      subscriptionStatus: (r.subscription_status as string | null) ?? null,
    };
  });

  const search = params?.search?.trim().toLowerCase();
  const roleFilter = params?.role;

  return rows.filter((row) => {
    if (roleFilter && row.role !== roleFilter) return false;
    if (!search) return true;
    return [row.displayName, row.fullName ?? "", row.email ?? "", row.id]
      .some((value) => value.toLowerCase().includes(search));
  });
}
