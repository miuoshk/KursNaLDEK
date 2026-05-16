import "server-only";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { hasAnyActiveEntitlement, hasActiveEntitlementForSelection } from "@/features/access/server/entitlements";
import { loadCurrentSelectionAccess } from "@/features/access/server/currentAccess";
import { isTestModeCookie, TEST_MODE_COOKIE_NAME } from "@/lib/testMode";

async function isTestModeEnabled() {
  const jar = await cookies();
  return isTestModeCookie(jar.get(TEST_MODE_COOKIE_NAME)?.value);
}

export async function requireAnyEntitlementOrRedirect() {
  if (await isTestModeEnabled()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hasAny = await hasAnyActiveEntitlement(user.id);
  if (!hasAny) {
    redirect("/wybor-roku");
  }

  return user;
}

export async function requireCurrentSelectionAccessOrRedirect() {
  if (await isTestModeEnabled()) {
    return {
      user: null,
      current: {
        track: "stomatologia" as const,
        year: 2 as const,
        hasAccess: true,
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const current = await loadCurrentSelectionAccess(user.id);
  if (!current.hasAccess) {
    redirect("/wybor-roku");
  }

  return { user, current };
}

export async function hasAccessForSubjectSelection(track: string, year: number): Promise<boolean> {
  if (await isTestModeEnabled()) {
    return true;
  }

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
