import { DashboardTooltipProvider } from "@/features/shared/components/DashboardTooltipProvider";
import { DashboardContentArea } from "@/features/shared/components/DashboardContentArea";
import { DashboardProviders } from "@/features/shared/components/DashboardProviders";
import { Sidebar } from "@/features/shared/components/Sidebar";
import { DashboardBreadcrumbProvider } from "@/features/shared/contexts/DashboardBreadcrumbContext";
import { DashboardDataProvider } from "@/features/shared/contexts/DashboardDataContext";
import { DashboardUserProvider } from "@/features/shared/contexts/DashboardUserContext";
import { getPreferredSessionCount } from "@/features/session/lib/sessionCount";
import { normalizeTrack } from "@/features/access/lib/studyAccess";
import { getCachedKnnpCatalog } from "@/features/shared/server/knnpCatalogCache";
import { pingPresence } from "@/features/shared/server/pingPresence";
import { getDueReviewCount } from "@/lib/dashboard/getDueReviewCount";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { getDashboardYear } from "@/lib/dashboard/getDashboardYear";
import { greetingName } from "@/lib/greetingName";
import { initialsFromName } from "@/lib/initialsFromName";
import { createClient } from "@/lib/supabase/server";
import { isTestModeCookie, TEST_MODE_COOKIE_NAME } from "@/lib/testMode";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { assertAccountNotBlocked } from "@/lib/auth/accountBan";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const year = await getDashboardYear();
  const jar = await cookies();
  const testMode = isTestModeCookie(jar.get(TEST_MODE_COOKIE_NAME)?.value);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "Użytkownik";
  let streak = 0;
  let dueReviewsCount = 0;
  let preferredSessionCount = 25;
  let userEmail: string | null = null;
  let avatarEmoji: string | null = null;
  let currentTrack: "stomatologia" | "lekarski" = "stomatologia";
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

  if (testMode) {
    displayName = "Tryb testowy";
    streak = 0;
  } else if (user) {
    const { blocked } = await assertAccountNotBlocked({ email: user.email });
    if (blocked) {
      await supabase.auth.signOut();
      redirect("/login");
    }

    userEmail = user.email ?? null;
    void pingPresence();
    const profileRow = await getProfileByUserId(user.id);
    const userTrack = profileRow?.current_track ?? "stomatologia";
    const userYear = profileRow?.current_year ?? 1;
    currentTrack = normalizeTrack(userTrack);
    // Prerozgrzewamy katalog (track, year) — `getDueReviewCount` zaraz go
    // wczyta z tego samego React cache (jedno żądanie, bez duplikacji).
    await getCachedKnnpCatalog(userTrack, userYear);
    dueReviewsCount = await getDueReviewCount(supabase, user.id, userTrack, userYear);
    preferredSessionCount = getPreferredSessionCount(profileRow);
    displayName = greetingName(profileRow, userEmail);
    streak = profileRow?.current_streak ?? 0;
    avatarEmoji =
      (profileRow as { avatar_emoji?: string | null } | null)?.avatar_emoji ?? null;
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
                testMode: testMode || undefined,
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
