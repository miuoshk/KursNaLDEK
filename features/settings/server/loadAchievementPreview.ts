import type { SupabaseClient } from "@supabase/supabase-js";
import { ACHIEVEMENTS } from "@/features/gamification/lib/achievements-config";

export type BadgePreviewItem = {
  id: string;
  unlocked: boolean;
  icon: string;
};

export async function loadAchievementPreview(
  supabase: SupabaseClient,
  userId: string,
): Promise<BadgePreviewItem[]> {
  const slice = ACHIEVEMENTS.slice(0, 6);
  const { data } = await supabase
    .from("user_achievements")
    .select("achievement_id, unlocked")
    .eq("user_id", userId);

  const unlocked = new Set(
    (data ?? []).filter((r) => r.unlocked).map((r) => r.achievement_id as string),
  );

  return slice.map((a) => ({
    id: a.id,
    unlocked: unlocked.has(a.id),
    icon: a.icon,
  }));
}
