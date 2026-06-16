"use client";

import { useTranslations } from "next-intl";
import { AchievementCard } from "@/features/gamification/components/AchievementCard";
import type { AchievementRow } from "@/features/gamification/types";

export function AchievementsGrid({ achievements }: { achievements: AchievementRow[] }) {
  const t = useTranslations("gamification");
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;

  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-primary">{t("page.title")}</h2>
      <p className="mt-1 font-body text-body-sm text-muted">
        {t("achievements.unlockedCount", { unlocked, total })}
      </p>
      {achievements.length === 0 ? (
        <p className="mt-6 font-body text-body-md text-secondary">
          {t("achievements.empty")}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {achievements.map((row) => (
            <AchievementCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}
