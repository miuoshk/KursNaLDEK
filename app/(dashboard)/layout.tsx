import { DashboardTooltipProvider } from "@/features/shared/components/DashboardTooltipProvider";
import { DashboardContentArea } from "@/features/shared/components/DashboardContentArea";
import { DashboardProviders } from "@/features/shared/components/DashboardProviders";
import { Sidebar } from "@/features/shared/components/Sidebar";
import { DashboardBreadcrumbProvider } from "@/features/shared/contexts/DashboardBreadcrumbContext";
import { DashboardDataProvider } from "@/features/shared/contexts/DashboardDataContext";
import { DashboardUserProvider } from "@/features/shared/contexts/DashboardUserContext";
import { getCachedKnnpCatalog } from "@/features/shared/server/knnpCatalogCache";
import { getDueReviewCount } from "@/lib/dashboard/getDueReviewCount";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { getDashboardYear } from "@/lib/dashboard/getDashboardYear";
import { greetingName } from "@/lib/greetingName";
import { initialsFromName } from "@/lib/initialsFromName";
import { createClient } from "@/lib/supabase/server";
import { isTestModeCookie, TEST_MODE_COOKIE_NAME } from "@/lib/testMode";
import { cookies } from "next/headers";

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
  let userEmail: string | null = null;
  let profileSnapshot: {
    display_name: string | null;
    current_streak: number | null;
    daily_goal: number | null;
    longest_streak: number | null;
    xp: number | null;
  } | null = null;

  if (testMode) {
    displayName = "Tryb testowy";
    streak = 0;
  } else if (user) {
    userEmail = user.email ?? null;
    const [profileRow, _, due] = await Promise.all([
      getProfileByUserId(user.id),
      getCachedKnnpCatalog(),
      getDueReviewCount(supabase, user.id),
    ]);
    dueReviewsCount = due;
    displayName = greetingName(profileRow, userEmail);
    streak = profileRow?.current_streak ?? 0;
    if (profileRow) {
      profileSnapshot = {
        display_name: profileRow.display_name,
        current_streak: profileRow.current_streak,
        daily_goal: profileRow.daily_goal,
        longest_streak: profileRow.longest_streak,
        xp: profileRow.xp ?? null,
      };
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
                dueReviewsCount,
                testMode: testMode || undefined,
              }}
            >
              <div className="flex h-screen min-h-0 overflow-hidden bg-brand-bg">
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
