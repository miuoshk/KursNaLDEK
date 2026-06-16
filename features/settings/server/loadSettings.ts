import type { SupabaseClient } from "@supabase/supabase-js";
import type { SettingsProfile } from "@/features/settings/types";
import type { KnnpSessionMode } from "@/features/session/types";
import { defaultLocale, isAppLocale } from "@/i18n/config";

const DEFAULT_MODE: KnnpSessionMode = "inteligentna";

export async function loadSettings(
  supabase: SupabaseClient,
  userId: string,
  options?: { email?: string | null },
): Promise<{ profile: SettingsProfile; email: string | null }> {
  const { data: profileRow } = await supabase
    .from("profiles")
    .select(
      "full_name, nick, display_name, avatar_initials, avatar_emoji, current_track, current_year, locale, exam_date, daily_goal, default_session_mode, default_question_count, show_session_timer, show_session_topics, notifications_reviews, notifications_weekly, subscription_status, subscription_ends_at, stripe_customer_id",
    )
    .eq("id", userId)
    .maybeSingle();

  const email =
    options?.email !== undefined
      ? options.email
      : (await supabase.auth.getUser()).data.user?.email ?? null;

  const rawMode = profileRow?.default_session_mode as string | null;
  const mode: KnnpSessionMode =
    rawMode === "inteligentna" || rawMode === "przeglad" || rawMode === "katalog"
      ? rawMode
      : DEFAULT_MODE;

  const rawCount = profileRow?.default_question_count as number | null;
  const count = rawCount === 10 || rawCount === 25 || rawCount === 50 ? rawCount : 25;

  const profile: SettingsProfile = {
    full_name: profileRow?.full_name ?? profileRow?.display_name ?? "Użytkownik",
    nick: profileRow?.nick ?? profileRow?.display_name ?? "uzytkownik",
    avatar_initials: profileRow?.avatar_initials ?? null,
    avatar_emoji: (profileRow?.avatar_emoji as string | null | undefined) ?? null,
    current_track: profileRow?.current_track ?? "stomatologia",
    current_year: profileRow?.current_year ?? 1,
    locale: isAppLocale(profileRow?.locale) ? profileRow.locale : defaultLocale,
    exam_date: (profileRow?.exam_date as string | null | undefined) ?? null,
    daily_goal: profileRow?.daily_goal ?? 25,
    default_session_mode: mode,
    default_question_count: count,
    show_session_timer: profileRow?.show_session_timer ?? true,
    show_session_topics: profileRow?.show_session_topics ?? true,
    notifications_reviews: profileRow?.notifications_reviews ?? true,
    notifications_weekly: profileRow?.notifications_weekly ?? false,
    subscription_status: profileRow?.subscription_status ?? "inactive",
    subscription_ends_at: profileRow?.subscription_ends_at ?? null,
    stripe_customer_id: profileRow?.stripe_customer_id ?? null,
  };

  return { profile, email };
}
