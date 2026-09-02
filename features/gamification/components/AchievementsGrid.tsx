"use client";

import { useTranslations } from "next-intl";
import { Award } from "lucide-react";
import { AchievementCard } from "@/features/gamification/components/AchievementCard";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { emptyRycinaId } from "@/features/shared/lib/rycinaCatalog";
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
        <EmptyState
          icon={Award}
          rycinaId={emptyRycinaId("achievements")}
          title={t("achievements.empty")}
          className="mt-6"
        />
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
