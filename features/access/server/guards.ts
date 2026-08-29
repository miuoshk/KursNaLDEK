import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import {
  hasAnyActiveEntitlement,
  hasActiveEntitlementForProduct,
  hasActiveEntitlementForSelection,
} from "@/features/access/server/entitlements";
import { shouldBypassPurchaseGate } from "@/features/access/lib/purchaseGate";
import { usesDurationGate } from "@/features/access/lib/gateCatalog";
import { normalizeProduct, normalizeTrack } from "@/features/access/lib/studyAccess";
import { loadCurrentSelectionAccess } from "@/features/access/server/currentAccess";
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
  const product = normalizeProduct(profile?.current_product);
  if (shouldBypassPurchaseGate(product, profile?.role)) {
    return user;
  }

  if (usesDurationGate(product)) {
    const hasProduct = await hasActiveEntitlementForProduct(user.id, product);
    if (!hasProduct) {
      redirect("/wybor-roku");
    }
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
  const profile = await getProfileByUserId(user.id);

  if (usesDurationGate(normalizedProduct) || normalizedProduct === "ldek") {
    if (normalizeProduct(profile?.current_product) !== normalizedProduct) {
      return false;
    }
    if (shouldBypassPurchaseGate(normalizedProduct, profile?.role)) {
      return true;
    }
    return hasActiveEntitlementForProduct(user.id, normalizedProduct);
  }

  return hasActiveEntitlementForSelection(
    user.id,
    track === "lekarski" ? "lekarski" : "stomatologia",
    year === 2 || year === 3 ? year : 1,
    "knnp",
  );
}
