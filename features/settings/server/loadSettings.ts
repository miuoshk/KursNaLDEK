import type { SupabaseClient } from "@supabase/supabase-js";
import type { SettingsProfile } from "@/features/settings/types";
import type { SessionMode } from "@/features/session/types";

const DEFAULT_MODE: SessionMode = "inteligentna";

export async function loadSettings(
  supabase: SupabaseClient,
  userId: string,
  options?: { email?: string | null },
): Promise<{ profile: SettingsProfile; email: string | null }> {
  const { data: profileRow } = await supabase
    .from("profiles")
    .select(
      "display_name, avatar_initials, current_track, current_year, daily_goal, default_session_mode, default_question_count, notifications_reviews, notifications_weekly, subscription_status, subscription_ends_at, stripe_customer_id",
    )
    .eq("id", userId)
    .maybeSingle();

  const email =
    options?.email !== undefined
      ? options.email
      : (await supabase.auth.getUser()).data.user?.email ?? null;

  const rawMode = profileRow?.default_session_mode as string | null;
  const mode: SessionMode =
    rawMode === "inteligentna" || rawMode === "przeglad" || rawMode === "katalog"
      ? rawMode
      : DEFAULT_MODE;

  const rawCount = profileRow?.default_question_count as number | null;
  const count = rawCount === 10 || rawCount === 25 || rawCount === 50 ? rawCount : 25;

  const profile: SettingsProfile = {
    display_name: profileRow?.display_name ?? "Użytkownik",
    avatar_initials: profileRow?.avatar_initials ?? null,
    current_track: profileRow?.current_track ?? "stomatologia",
    current_year: profileRow?.current_year ?? 1,
    daily_goal: profileRow?.daily_goal ?? 25,
    default_session_mode: mode,
    default_question_count: count,
    notifications_reviews: profileRow?.notifications_reviews ?? true,
    notifications_weekly: profileRow?.notifications_weekly ?? false,
    subscription_status: profileRow?.subscription_status ?? "inactive",
    subscription_ends_at: profileRow?.subscription_ends_at ?? null,
    stripe_customer_id: profileRow?.stripe_customer_id ?? null,
  };

  return { profile, email };
}
