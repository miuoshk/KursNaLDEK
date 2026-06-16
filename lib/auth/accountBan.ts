import "server-only";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const ACCOUNT_BLOCKED_MESSAGE_KEY = "accountBlocked" as const;

export const LOGIN_BLOCKED_QUERY = "blocked";
export const ACCESS_REVOKED_QUERY = "revoked";

export async function getClientIpFromHeaders(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = h.get("x-real-ip")?.trim();
  return realIp || null;
}

export async function isAccountBlocked(params: {
  email?: string | null;
  ip?: string | null;
}): Promise<boolean> {
  const email = params.email?.trim();
  const ip = params.ip?.trim();
  if (!email && !ip) return false;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_account_blocked", {
    p_email: email ?? null,
    p_ip: ip ?? null,
  });

  if (error) {
    console.error("[isAccountBlocked]", error.message);
    // Fail-closed: przy błędzie DB nie wpuszczamy — bezpieczniej niż omijanie bana.
    return true;
  }

  return data === true;
}

export async function assertAccountNotBlocked(params: {
  email?: string | null;
  ip?: string | null;
}): Promise<{ blocked: boolean; ip: string | null }> {
  const ip = params.ip ?? (await getClientIpFromHeaders());
  const blocked = await isAccountBlocked({ email: params.email, ip });
  return { blocked, ip };
}
