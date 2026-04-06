import { redirect } from "next/navigation";
import { AccountSection } from "@/features/settings/components/AccountSection";
import { AchievementsBadgesPreview } from "@/features/settings/components/AchievementsBadgesPreview";
import { NotificationsSection } from "@/features/settings/components/NotificationsSection";
import { ProfileSection } from "@/features/settings/components/ProfileSection";
import { SettingsBreadcrumb } from "@/features/settings/components/SettingsBreadcrumb";
import { StudyPreferencesSection } from "@/features/settings/components/StudyPreferencesSection";
import { SubscriptionSection } from "@/features/settings/components/SubscriptionSection";
import { loadAchievementPreview } from "@/features/settings/server/loadAchievementPreview";
import { loadSettings } from "@/features/settings/server/loadSettings";
import { createClient } from "@/lib/supabase/server";

function Divider() {
  return <div className="border-t border-[rgba(255,255,255,0.06)] py-8" />;
}

export default async function UstawieniaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = user.email ?? null;
  const [{ profile, email: resolvedEmail }, badges] = await Promise.all([
    loadSettings(supabase, user.id, { email }),
    loadAchievementPreview(supabase, user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <SettingsBreadcrumb />
      <h1 className="font-heading text-heading-xl text-primary">Ustawienia</h1>
      <div className="mt-10">
        <ProfileSection profile={profile} email={resolvedEmail} />
      </div>
      <Divider />
      <SubscriptionSection profile={profile} />
      <Divider />
      <StudyPreferencesSection profile={profile} />
      <Divider />
      <NotificationsSection profile={profile} />
      <Divider />
      <AccountSection email={resolvedEmail} />
      <Divider />
      <AchievementsBadgesPreview items={badges} />
    </div>
  );
}
