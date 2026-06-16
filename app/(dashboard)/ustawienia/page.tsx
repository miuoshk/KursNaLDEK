import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccountSection } from "@/features/settings/components/AccountSection";
import { AchievementsBadgesPreview } from "@/features/settings/components/AchievementsBadgesPreview";
import { ExamDateSection } from "@/features/settings/components/ExamDateSection";
import { LanguageSection } from "@/features/settings/components/LanguageSection";
import { NotificationsSection } from "@/features/settings/components/NotificationsSection";
import { ProfileSection } from "@/features/settings/components/ProfileSection";
import { SettingsBreadcrumb } from "@/features/settings/components/SettingsBreadcrumb";
import { StudyPreferencesSection } from "@/features/settings/components/StudyPreferencesSection";
import { SubscriptionSection } from "@/features/settings/components/SubscriptionSection";
import { loadAchievementPreview } from "@/features/settings/server/loadAchievementPreview";
import { loadSettings } from "@/features/settings/server/loadSettings";
import { LegalFooterLinks } from "@/features/legal/components/LegalFooterLinks";
import { createClient } from "@/lib/supabase/server";

export default async function UstawieniaPage() {
  const t = await getTranslations("settings");
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
    <div className="mx-auto max-w-2xl space-y-8">
      <SettingsBreadcrumb />
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          {t("page.title")}
        </h1>
        <p className="mt-1 font-body text-sm text-secondary">{t("page.subtitle")}</p>
      </header>
      <LanguageSection />
      <ProfileSection profile={profile} email={resolvedEmail} />
      <ExamDateSection examDate={profile.exam_date} />
      <SubscriptionSection profile={profile} />
      <StudyPreferencesSection profile={profile} />
      <NotificationsSection profile={profile} />
      <AccountSection email={resolvedEmail} />
      <AchievementsBadgesPreview items={badges} />
      <LegalFooterLinks />
    </div>
  );
}
