import { DashboardTooltipProvider } from "@/features/shared/components/DashboardTooltipProvider";
import { DashboardContentArea } from "@/features/shared/components/DashboardContentArea";
import { DashboardProviders } from "@/features/shared/components/DashboardProviders";
import { Sidebar } from "@/features/shared/components/Sidebar";
import { DashboardBreadcrumbProvider } from "@/features/shared/contexts/DashboardBreadcrumbContext";
import { DashboardUserProvider } from "@/features/shared/contexts/DashboardUserContext";
import { getDashboardYear } from "@/lib/dashboard/getDashboardYear";
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
  if (testMode) {
    displayName = "Tryb testowy";
    streak = 0;
  } else if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, current_streak")
      .eq("id", user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? displayName;
    streak = profile?.current_streak ?? 0;
  }
  const initials = initialsFromName(displayName);

  return (
    <DashboardProviders>
      <DashboardTooltipProvider>
        <DashboardBreadcrumbProvider year={year}>
          <DashboardUserProvider
            value={{ displayName, streak, initials, testMode: testMode || undefined }}
          >
            <div className="flex h-screen min-h-0 overflow-hidden bg-brand-bg">
              <Sidebar />
              <DashboardContentArea>{children}</DashboardContentArea>
            </div>
          </DashboardUserProvider>
        </DashboardBreadcrumbProvider>
      </DashboardTooltipProvider>
    </DashboardProviders>
  );
}
