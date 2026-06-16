import { getTranslations } from "next-intl/server";

export default async function DashboardHomePage() {
  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");

  return (
    <div className="font-body text-body-md text-secondary">
      <h1 className="font-heading text-heading-lg text-primary">{tNav("dashboard")}</h1>
      <p className="mt-2">{t("legacyDashboardWelcome")}</p>
    </div>
  );
}
