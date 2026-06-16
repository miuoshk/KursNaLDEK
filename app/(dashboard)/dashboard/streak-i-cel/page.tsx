import { getTranslations } from "next-intl/server";

export default async function StreakICelLegacyPage() {
  const t = await getTranslations("common");

  return (
    <div className="font-body text-body-md text-secondary">
      <h1 className="font-heading text-heading-lg text-primary">{t("legacyHabitsSoon")}</h1>
      <p className="mt-2 font-body text-body-md text-secondary">{t("legacyHabitsSoon")}</p>
    </div>
  );
}
