import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { hasAnyActiveEntitlement, hasActiveEntitlementForSelection } from "@/features/access/server/entitlements";
import { isClinicalProduct, loadCurrentSelectionAccess } from "@/features/access/server/currentAccess";
import { normalizeProduct, normalizeTrack } from "@/features/access/lib/studyAccess";
import { isUserAccessRevoked } from "@/lib/auth/accessRevocation";
import { ACCESS_REVOKED_QUERY } from "@/lib/auth/accountBan";

export async function requireAnyEntitlementOrRedirect() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (await isUserAccessRevoked(user.id)) {
    redirect(`/wybor-roku?${ACCESS_REVOKED_QUERY}=1`);
  }

  const profile = await getProfileByUserId(user.id);
  if (isClinicalProduct(normalizeProduct(profile?.current_product))) {
    return user;
  }

  const hasAny = await hasAnyActiveEntitlement(user.id);
  if (!hasAny) {
    redirect("/wybor-roku");
  }

  return user;
}

export async function requireCurrentSelectionAccessOrRedirect() {
  const user = await getCurrentUser();

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

export async function hasAccessForSubjectSelection(
  track: string,
  year: number,
  product?: string | null,
): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const normalizedProduct = normalizeProduct(product ?? undefined);
  if (isClinicalProduct(normalizedProduct)) {
    const profile = await getProfileByUserId(user.id);
    return normalizeProduct(profile?.current_product) === normalizedProduct;
  }

  return hasActiveEntitlementForSelection(
    user.id,
    track === "lekarski" ? "lekarski" : "stomatologia",
    year === 2 || year === 3 ? year : 1,
  );
}
