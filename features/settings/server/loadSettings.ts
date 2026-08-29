import type { SupabaseClient } from "@supabase/supabase-js";
import type { SettingsProfile } from "@/features/settings/types";
import type { KnnpSessionMode } from "@/features/session/types";
import { defaultLocale, isAppLocale } from "@/i18n/config";
import {
  normalizeProduct,
  normalizeTrack,
  normalizeYear,
} from "@/features/access/lib/studyAccess";
import { getEntitlementExpiresAt } from "@/features/access/lib/entitlementExpiry";
import {
  hasActiveEntitlementForProduct,
  hasActiveEntitlementForSelection,
} from "@/features/access/server/entitlements";
import { shouldBypassPurchaseGate } from "@/features/access/lib/purchaseGate";
import { usesDurationGate } from "@/features/access/lib/gateCatalog";
import { isProfileAdmin } from "@/lib/auth/profileAdmin";

const DEFAULT_MODE: KnnpSessionMode = "inteligentna";

export async function loadSettings(
  supabase: SupabaseClient,
  userId: string,
  options?: { email?: string | null },
): Promise<{ profile: SettingsProfile; email: string | null }> {
  const { data: profileRow } = await supabase
    .from("profiles")
    .select(
      "full_name, nick, display_name, avatar_initials, avatar_emoji, current_track, current_year, current_product, role, locale, exam_date, daily_study_minutes, daily_goal, default_session_mode, default_question_count, show_session_timer, show_session_topics, default_question_source, notifications_reviews, notifications_weekly, subscription_status, subscription_ends_at, stripe_customer_id",
    )
    .eq("id", userId)
    .maybeSingle();

  const email =
    options?.email !== undefined
      ? options.email
      : ((await supabase.auth.getUser()).data.user?.email ?? null);

  const rawMode = profileRow?.default_session_mode as string | null;
  const mode: KnnpSessionMode =
    rawMode === "inteligentna" ||
    rawMode === "przeglad" ||
    rawMode === "katalog"
      ? rawMode
      : DEFAULT_MODE;

  const rawCount = profileRow?.default_question_count as number | null;
  const count =
    rawCount === 10 || rawCount === 25 || rawCount === 50 ? rawCount : 25;

  const profile: SettingsProfile = {
    full_name:
      profileRow?.full_name ?? profileRow?.display_name ?? "Użytkownik",
    nick: profileRow?.nick ?? profileRow?.display_name ?? "uzytkownik",
    avatar_initials: profileRow?.avatar_initials ?? null,
    avatar_emoji:
      (profileRow?.avatar_emoji as string | null | undefined) ?? null,
    current_track: profileRow?.current_track ?? "stomatologia",
    current_year: profileRow?.current_year ?? 1,
    current_product: normalizeProduct(
      profileRow?.current_product as string | null | undefined,
    ),
    can_switch_product: isProfileAdmin(profileRow?.role),
    locale: isAppLocale(profileRow?.locale) ? profileRow.locale : defaultLocale,
    exam_date: (profileRow?.exam_date as string | null | undefined) ?? null,
    daily_study_minutes: profileRow?.daily_study_minutes ?? 25,
    daily_goal: profileRow?.daily_goal ?? 25,
    default_session_mode: mode,
    default_question_count: count,
    show_session_timer: profileRow?.show_session_timer ?? true,
    show_session_topics: profileRow?.show_session_topics ?? true,
    default_question_source:
      profileRow?.default_question_source === "reference" ||
      profileRow?.default_question_source === "own"
        ? profileRow.default_question_source
        : "all",
    notifications_reviews: profileRow?.notifications_reviews ?? true,
    notifications_weekly: profileRow?.notifications_weekly ?? false,
    subscription_status: profileRow?.subscription_status ?? "inactive",
    subscription_ends_at: profileRow?.subscription_ends_at ?? null,
    stripe_customer_id: profileRow?.stripe_customer_id ?? null,
  };

  const track = normalizeTrack(profile.current_track);
  const year = normalizeYear(profile.current_year);
  const hasAccess =
    shouldBypassPurchaseGate(profile.current_product, profileRow?.role) ||
    (usesDurationGate(profile.current_product)
      ? await hasActiveEntitlementForProduct(userId, profile.current_product)
      : await hasActiveEntitlementForSelection(userId, track, year, "knnp"));
  if (!hasAccess) {
    profile.subscription_status = "inactive";
  } else if (!profile.subscription_ends_at) {
    let entitlementQuery = supabase
      .from("user_year_entitlements")
      .select("access_type, granted_at, access_days")
      .eq("user_id", userId)
      .eq("product", profile.current_product)
      .eq("active", true);
    if (!usesDurationGate(profile.current_product)) {
      entitlementQuery = entitlementQuery.eq("track", track).eq("year", year);
    }
    const { data: entitlementRow } = await entitlementQuery.maybeSingle();
    if (entitlementRow?.granted_at) {
      const expiresAt = getEntitlementExpiresAt(
        entitlementRow.granted_at as string,
        entitlementRow.access_type as "free_test" | "paid",
        entitlementRow.access_days as number | null,
      );
      profile.subscription_ends_at = expiresAt?.toISOString() ?? null;
    }
  }

  return { profile, email };
}
