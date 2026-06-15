import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAnyActiveEntitlement, hasActiveEntitlementForSelection } from "@/features/access/server/entitlements";
import { loadCurrentSelectionAccess } from "@/features/access/server/currentAccess";
import { isUserAccessRevoked } from "@/lib/auth/accessRevocation";
import { ACCESS_REVOKED_QUERY } from "@/lib/auth/accountBan";

export async function requireAnyEntitlementOrRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (await isUserAccessRevoked(user.id)) {
    redirect(`/wybor-roku?${ACCESS_REVOKED_QUERY}=1`);
  }

  const hasAny = await hasAnyActiveEntitlement(user.id);
  if (!hasAny) {
    redirect("/wybor-roku");
  }

  return user;
}

export async function requireCurrentSelectionAccessOrRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (await isUserAccessRevoked(user.id)) {
    redirect(`/wybor-roku?${ACCESS_REVOKED_QUERY}=1`);
  }

  const current = await loadCurrentSelectionAccess(user.id);
  if (!current.hasAccess) {
    redirect("/wybor-roku");
  }

  return { user, current };
}

export async function hasAccessForSubjectSelection(track: string, year: number): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  return hasActiveEntitlementForSelection(
    user.id,
    track === "lekarski" ? "lekarski" : "stomatologia",
    year === 2 || year === 3 ? year : 1,
  );
}
