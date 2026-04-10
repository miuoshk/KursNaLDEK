import Link from "next/link";
import { Lock } from "lucide-react";
import { achievementLucide } from "@/features/gamification/lib/achievementIcons";
import type { BadgePreviewItem } from "@/features/settings/server/loadAchievementPreview";
import { cn } from "@/lib/utils";

type Props = { items: BadgePreviewItem[] };

export function AchievementsBadgesPreview({ items }: Props) {
  return (
    <section>
      <h2 className="text-body-xs font-medium uppercase tracking-widest text-muted">OSIĄGNIĘCIA</h2>
      <div className="mt-6 grid grid-cols-6 gap-3 sm:max-w-md">
        {items.map((item) => {
          const Icon = achievementLucide(item.icon);
          return (
            <div
              key={item.id}
              className={cn(
                "flex size-10 items-center justify-center rounded-full border-2",
                item.unlocked
                  ? "border-brand-gold text-brand-gold"
                  : "border-border text-muted",
              )}
              aria-hidden
            >
              {item.unlocked ? (
                <Icon className="size-5" />
              ) : (
                <Lock className="size-5" />
              )}
            </div>
          );
        })}
      </div>
      <Link
        href="/osiagniecia"
        className="mt-4 inline-block font-body text-body-sm text-brand-sage transition hover:text-brand-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
      >
        Zobacz wszystkie osiągnięcia →
      </Link>
    </section>
  );
}
