import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AccessType, StudyTrack, StudyYear } from "@/features/access/lib/studyAccess";
import { normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";
import { isEntitlementCurrentlyValid } from "@/features/access/lib/entitlementExpiry";

export type Entitlement = {
  id: string;
  track: StudyTrack;
  year: StudyYear;
  access_type: AccessType;
  active: boolean;
  granted_at: string;
};

type EntitlementRow = {
  id: string;
  track: string;
  year: number;
  access_type: AccessType;
  active: boolean;
  granted_at: string;
};

export async function listActiveEntitlementsByUserId(userId: string): Promise<Entitlement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_year_entitlements")
    .select("id, track, year, access_type, active, granted_at")
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
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_year_entitlements")
    .select("id, access_type, granted_at, active")
    .eq("user_id", userId)
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
  return isEntitlementCurrentlyValid(data as EntitlementRow);
}

export async function hasAnyActiveEntitlement(userId: string): Promise<boolean> {
  const entitlements = await listActiveEntitlementsByUserId(userId);
  return entitlements.length > 0;
}

function normalizeEntitlementRow(row: EntitlementRow): Entitlement {
  return {
    id: row.id,
    track: normalizeTrack(row.track),
    year: normalizeYear(row.year),
    access_type: row.access_type,
    active: Boolean(row.active),
    granted_at: row.granted_at,
  };
}
