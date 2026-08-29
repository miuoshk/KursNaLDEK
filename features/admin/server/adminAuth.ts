import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminRole = "admin" | "moderator";

function isAdminRole(value: unknown): value is AdminRole {
  return value === "admin" || value === "moderator";
}

/**
 * Resolves current user and role for admin area.
 * Fallback via service role avoids false negatives caused by restrictive RLS policies.
 */
export async function getAdminAccessContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false as const, user: null, role: null };
  }

  // Primary path: read profile role through regular user session.
  const primary = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!primary.error && isAdminRole(primary.data?.role)) {
    return { allowed: true as const, user, role: primary.data.role };
  }

  // Fallback path: service role query (server-side only).
  try {
    const admin = createAdminClient();
    const fallback = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (isAdminRole(fallback.data?.role)) {
      return { allowed: true as const, user, role: fallback.data.role };
    }
  } catch (error) {
    console.error("[getAdminAccessContext] fallback error", error);
  }

  return { allowed: false as const, user, role: null };
}

export async function requireAdminAccess() {
  const ctx = await getAdminAccessContext();
  if (!ctx.user) {
    throw new Error("Unauthorized");
  }
  if (!ctx.allowed) {
    throw new Error("Forbidden");
  }
  return ctx;
}

/** Lista UUID z `ROTA_OWNER_IDS` (przecinki / białe znaki). */
export function parseRotaOwnerIds(raw: string | undefined = process.env.ROTA_OWNER_IDS): string[] {
  return (raw ?? "")
    .split(/[,\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Panel CEM / operacje mapowania: admin + (gdy env ustawione) UUID z ROTA_OWNER_IDS.
 * Pusta lista = jak reszta admina (każdy z rolą admin/moderator).
 */
export async function requireRotaOwner() {
  const ctx = await requireAdminAccess();
  const owners = parseRotaOwnerIds();
  if (owners.length > 0 && !owners.includes(ctx.user.id)) {
    throw new Error("Forbidden");
  }
  return ctx;
}
