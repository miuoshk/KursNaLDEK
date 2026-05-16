import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AccessType, StudyTrack, StudyYear } from "@/features/access/lib/studyAccess";
import { normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";

export type Entitlement = {
  id: string;
  track: StudyTrack;
  year: StudyYear;
  access_type: AccessType;
  active: boolean;
};

type EntitlementRow = {
  id: string;
  track: string;
  year: number;
  access_type: AccessType;
  active: boolean;
};

export async function listActiveEntitlementsByUserId(userId: string): Promise<Entitlement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_year_entitlements")
    .select("id, track, year, access_type, active")
    .eq("user_id", userId)
    .eq("active", true);

  if (error) {
    console.error("[entitlements] listActiveEntitlementsByUserId", error.message);
    return [];
  }

  return (data ?? []).map((row) => normalizeEntitlementRow(row as EntitlementRow));
}

export async function hasActiveEntitlementForSelection(
  userId: string,
  track: StudyTrack,
  year: StudyYear,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_year_entitlements")
    .select("id")
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
  return Boolean(data);
}

export async function hasAnyActiveEntitlement(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_year_entitlements")
    .select("id")
    .eq("user_id", userId)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[entitlements] hasAnyActiveEntitlement", error.message);
    return false;
  }
  return Boolean(data);
}

function normalizeEntitlementRow(row: EntitlementRow): Entitlement {
  return {
    id: row.id,
    track: normalizeTrack(row.track),
    year: normalizeYear(row.year),
    access_type: row.access_type,
    active: Boolean(row.active),
  };
}
