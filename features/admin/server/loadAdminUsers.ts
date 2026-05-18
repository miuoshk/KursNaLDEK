import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUserRole = "admin" | "moderator" | "student";
export type AdminUserTrack = "lekarski" | "stomatologia" | "inny" | "";

export type AdminUserRow = {
  id: string;
  displayName: string;
  fullName: string | null;
  email: string | null;
  role: AdminUserRole;
  track: string | null;
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
  track?: AdminUserTrack;
  year?: number | null;
}): Promise<AdminUserRow[]> {
  const supabase = await createClient();

  const { data: profileRows, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, full_name, role, current_track, current_year, subscription_status, created_at",
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
      track: (r.current_track as string | null) ?? null,
      createdAt: (r.created_at as string | null) ?? null,
      lastSignInAt: auth?.lastSignInAt ?? null,
      currentYear: (r.current_year as number | null) ?? null,
      subscriptionStatus: (r.subscription_status as string | null) ?? null,
    };
  });

  const search = params?.search?.trim().toLowerCase();
  const roleFilter = params?.role;
  const trackFilter = params?.track;
  const yearFilter = params?.year ?? null;

  return rows.filter((row) => {
    if (roleFilter && row.role !== roleFilter) return false;
    if (trackFilter) {
      if (trackFilter === "inny") {
        if (row.track === "lekarski" || row.track === "stomatologia") return false;
      } else if (row.track !== trackFilter) {
        return false;
      }
    }
    if (yearFilter !== null && row.currentYear !== yearFilter) return false;
    if (!search) return true;
    return [row.displayName, row.fullName ?? "", row.email ?? "", row.id]
      .some((value) => value.toLowerCase().includes(search));
  });
}

/**
 * Lekka funkcja zwracająca aktualnie zarejestrowane kombinacje track+rok,
 * żeby można było zbudować dynamiczny pasek filtrów (tylko z istniejącymi
 * wariantami).
 */
export async function loadAdminUserFacets(): Promise<{
  tracks: Array<{ value: AdminUserTrack; label: string; count: number }>;
  years: Array<{ value: number; count: number }>;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("current_track, current_year");

  if (error || !data) {
    return { tracks: [], years: [] };
  }

  const trackCounts = new Map<AdminUserTrack, number>();
  const yearCounts = new Map<number, number>();

  for (const row of data) {
    const t = (row.current_track as string | null) ?? "";
    const trackKey: AdminUserTrack =
      t === "lekarski" || t === "stomatologia"
        ? t
        : t.length > 0
          ? "inny"
          : "inny";
    trackCounts.set(trackKey, (trackCounts.get(trackKey) ?? 0) + 1);
    const y = row.current_year as number | null;
    if (typeof y === "number") {
      yearCounts.set(y, (yearCounts.get(y) ?? 0) + 1);
    }
  }

  const trackLabels: Record<AdminUserTrack, string> = {
    lekarski: "Lekarski",
    stomatologia: "Stomatologia",
    inny: "Inny",
    "": "Wszyscy",
  };

  const tracks = (Array.from(trackCounts.entries()) as Array<
    [Exclude<AdminUserTrack, "">, number]
  >)
    .map(([value, count]) => ({
      value,
      label: trackLabels[value],
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const years = Array.from(yearCounts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value - b.value);

  return { tracks, years };
}
