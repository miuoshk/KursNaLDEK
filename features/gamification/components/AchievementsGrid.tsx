import { AchievementCard } from "@/features/gamification/components/AchievementCard";
import type { AchievementRow } from "@/features/gamification/types";

export function AchievementsGrid({ achievements }: { achievements: AchievementRow[] }) {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;

  return (
    <section>
      <h2 className="font-heading text-heading-md text-primary">Osiągnięcia</h2>
      <p className="mt-1 font-body text-body-sm text-muted">
        {unlocked} / {total} odblokowanych
      </p>
      {achievements.length === 0 ? (
        <p className="mt-6 font-body text-body-md text-secondary">
            Zacznij naukę, aby zdobywać osiągnięcia!
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
