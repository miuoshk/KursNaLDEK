import { DashboardTooltipProvider } from "@/features/shared/components/DashboardTooltipProvider";
import { DashboardContentArea } from "@/features/shared/components/DashboardContentArea";
import { DashboardProviders } from "@/features/shared/components/DashboardProviders";
import { Sidebar } from "@/features/shared/components/Sidebar";
import { DashboardBreadcrumbProvider } from "@/features/shared/contexts/DashboardBreadcrumbContext";
import { DashboardDataProvider } from "@/features/shared/contexts/DashboardDataContext";
import { DashboardUserProvider } from "@/features/shared/contexts/DashboardUserContext";
import { getPreferredSessionCount } from "@/features/session/lib/sessionCount";
import { normalizeTrack } from "@/features/access/lib/studyAccess";
import { pingPresence } from "@/features/shared/server/pingPresence";
import { getDueReviewCount } from "@/lib/dashboard/getDueReviewCount";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { greetingName } from "@/lib/greetingName";
import { initialsFromName } from "@/lib/initialsFromName";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { redirect } from "next/navigation";
import { assertAccountNotBlocked, LOGIN_BLOCKED_QUERY } from "@/lib/auth/accountBan";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Ban-check leci równolegle z pobraniem profilu/danych (niezależne zapytania).
  // Sprawdzamy wynik dopiero przed renderem — blokowany user i tak zostanie
  // wylogowany zanim cokolwiek zobaczy, a RLS chroni dane w międzyczasie.
  const blockedPromise = assertAccountNotBlocked({ email: user.email });

  const userEmail = user.email ?? null;
  const profileRow = await getProfileByUserId(user.id);
  const userTrack = profileRow?.current_track ?? "stomatologia";
  const userYear = profileRow?.current_year ?? 1;
  // Rok do breadcrumb/TopBar bierzemy z już-pobranego profilu zamiast osobnego
  // getDashboardYear() (który robił własny auth.getUser() + SELECT profiles).
  const year = userYear;
  const currentTrack = normalizeTrack(userTrack);

  // Presence ping z danymi z profilu — bez dodatkowego auth.getUser() i z
  // throttlem opartym o realny last_seen_at (działa na serverless).
  void pingPresence(
    user.id,
    (profileRow as { last_seen_at?: string | null } | null)?.last_seen_at ?? null,
  );
  const dueReviewsCount = await getDueReviewCount(supabase, user.id, userTrack, userYear);

  const { blocked } = await blockedPromise;
  if (blocked) {
    await supabase.auth.signOut();
    redirect(`/login?${LOGIN_BLOCKED_QUERY}=1`);
  }
  const preferredSessionCount = getPreferredSessionCount(profileRow);
  const displayName = greetingName(profileRow, userEmail);
  const streak = profileRow?.current_streak ?? 0;
  const avatarEmoji =
    (profileRow as { avatar_emoji?: string | null } | null)?.avatar_emoji ?? null;

  let profileSnapshot: {
    display_name: string | null;
    current_streak: number | null;
    daily_goal: number | null;
    longest_streak: number | null;
    xp: number | null;
    exam_date: string | null;
  } | null = null;
  let showSessionTimer = true;
  let showSessionTopics = true;

  if (profileRow) {
    profileSnapshot = {
      display_name: profileRow.display_name,
      current_streak: profileRow.current_streak,
      daily_goal: profileRow.daily_goal,
      longest_streak: profileRow.longest_streak,
      xp: profileRow.xp ?? null,
      exam_date: (profileRow.exam_date as string | null | undefined) ?? null,
    };
    showSessionTimer =
      (profileRow as { show_session_timer?: boolean }).show_session_timer ?? true;
    showSessionTopics =
      (profileRow as { show_session_topics?: boolean }).show_session_topics ?? true;
  }

  const initials = initialsFromName(displayName);

  return (
    <DashboardProviders>
      <DashboardDataProvider profile={profileSnapshot} userEmail={userEmail}>
        <DashboardTooltipProvider>
          <DashboardBreadcrumbProvider year={year}>
            <DashboardUserProvider
              value={{
                displayName,
                streak,
                initials,
                avatarEmoji,
                currentTrack,
                dueReviewsCount,
                preferredSessionCount,
                showSessionTimer,
                showSessionTopics,
              }}
            >
              <div className="flex h-screen min-h-0 overflow-hidden bg-background">
                <Sidebar />
                <DashboardContentArea>{children}</DashboardContentArea>
              </div>
            </DashboardUserProvider>
          </DashboardBreadcrumbProvider>
        </DashboardTooltipProvider>
      </DashboardDataProvider>
    </DashboardProviders>
  );
}
