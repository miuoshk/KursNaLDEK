import "server-only";
import { createClient } from "@/lib/supabase/server";

// Throttle: nie UPDATE'ujemy częściej niż raz na PING_INTERVAL_MS dla danego usera.
// Map żyje w pamięci procesu — w środowisku z wieloma instancjami throttle
// może być nieco mniej efektywny, ale to nie problem (DB UPDATE jest tani).
const PING_INTERVAL_MS = 60_000;
const lastPingByUser = new Map<string, number>();

/**
 * Aktualizuje `profiles.last_seen_at` dla danego usera.
 * Throttlowane do 1× / 60 s per user. Wywoływane z dashboard layout.
 *
 * Throttle opiera się PRZEDE WSZYSTKIM o `lastSeenIso` z DB (przekazywane z
 * już-pobranego profilu), bo mapa w pamięci procesu jest bezużyteczna na
 * serverless — każda zimna instancja startuje z pustą mapą i UPDATE leciał
 * praktycznie przy każdym żądaniu. Mapa zostaje jako szybki bezpiecznik dla
 * równoległych żądań na tej samej ciepłej instancji.
 *
 * Nie wykonuje już własnego `auth.getUser()` — `userId` dostarcza layout.
 * Cicho ignoruje błędy — to nie powinno blokować renderowania.
 */
export async function pingPresence(
  userId: string,
  lastSeenIso: string | null,
): Promise<void> {
  try {
    const now = Date.now();

    const lastSeenMs = lastSeenIso ? Date.parse(lastSeenIso) : 0;
    if (Number.isFinite(lastSeenMs) && lastSeenMs > 0 && now - lastSeenMs < PING_INTERVAL_MS) {
      return;
    }

    const last = lastPingByUser.get(userId) ?? 0;
    if (now - last < PING_INTERVAL_MS) return;
    lastPingByUser.set(userId, now);

    const supabase = await createClient();
    await supabase
      .from("profiles")
      .update({ last_seen_at: new Date(now).toISOString() })
      .eq("id", userId);
  } catch {
    // intentionally silent
  }
}

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function isOnline(lastSeenIso: string | null | undefined): boolean {
  if (!lastSeenIso) return false;
  const t = Date.parse(lastSeenIso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < ONLINE_WINDOW_MS;
}

/**
 * Zwraca liczbę userów aktywnych w ciągu ostatnich 5 minut (bez aktualnego usera).
 */
export async function loadActiveCount(excludeUserId?: string): Promise<number> {
  try {
    const supabase = await createClient();
    const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
    let query = supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("last_seen_at", since);
    if (excludeUserId) {
      query = query.neq("id", excludeUserId);
    }
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
