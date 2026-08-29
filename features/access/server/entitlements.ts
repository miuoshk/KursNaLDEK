import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AccessType, StudyProduct, StudyTrack, StudyYear } from "@/features/access/lib/studyAccess";
import { normalizeProduct, normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";
import { isEntitlementCurrentlyValid } from "@/features/access/lib/entitlementExpiry";

export type Entitlement = {
  id: string;
  product: StudyProduct;
  track: StudyTrack;
  year: StudyYear;
  access_type: AccessType;
  active: boolean;
  granted_at: string;
  offer_key: string | null;
  access_days: number | null;
};

type EntitlementRow = {
  id: string;
  product: string | null;
  track: string;
  year: number;
  access_type: AccessType;
  active: boolean;
  granted_at: string;
  offer_key: string | null;
  access_days: number | null;
};

const ENTITLEMENT_COLUMNS =
  "id, product, track, year, access_type, active, granted_at, offer_key, access_days";

export async function listActiveEntitlementsByUserId(userId: string): Promise<Entitlement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_year_entitlements")
    .select(ENTITLEMENT_COLUMNS)
    .eq("user_id", userId)
    .eq("active", true);

  if (error) {
    console.error("[entitlements] listActiveEntitlementsByUserId", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => normalizeEntitlementRow(row as EntitlementRow))
    .filter((row) => isEntitlementCurrentlyValid(row));
}

export async function hasActiveEntitlementForSelection(
  userId: string,
  track: StudyTrack,
  year: StudyYear,
  product: StudyProduct = "knnp",
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_year_entitlements")
    .select("id, access_type, granted_at, active, access_days, product")
    .eq("user_id", userId)
    .eq("product", product)
    .eq("track", track)
    .eq("year", year)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[entitlements] hasActiveEntitlementForSelection", error.message);
    return false;
  }
  if (!data) {
    return false;
  }
  return isEntitlementCurrentlyValid(data);
}

export async function hasActiveEntitlementForProduct(
  userId: string,
  product: StudyProduct,
): Promise<boolean> {
  const entitlements = await listActiveEntitlementsByUserId(userId);
  return entitlements.some((entry) => entry.product === product);
}

export async function hasAnyActiveEntitlement(userId: string): Promise<boolean> {
  const entitlements = await listActiveEntitlementsByUserId(userId);
  return entitlements.length > 0;
}

function normalizeEntitlementRow(row: EntitlementRow): Entitlement {
  return {
    id: row.id,
    product: normalizeProduct(row.product),
    track: normalizeTrack(row.track),
    year: normalizeYear(row.year),
    access_type: row.access_type,
    active: Boolean(row.active),
    granted_at: row.granted_at,
    offer_key: row.offer_key ?? null,
    access_days: row.access_days ?? null,
  };
}
