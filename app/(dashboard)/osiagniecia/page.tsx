import { getTranslations } from "next-intl/server";
import { RankTierTrack } from "@/features/gamification/components/RankTierTrack";
import { PlayerCard } from "@/features/gamification/components/PlayerCard";
import { AchievementsGrid } from "@/features/gamification/components/AchievementsGrid";
import { LeaderboardTable } from "@/features/gamification/components/LeaderboardTable";
import { DailyChallengeSection } from "@/features/gamification/components/DailyChallengeCard";
import { loadGamification } from "@/features/gamification/server/loadGamification";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import type { LeaderboardScope } from "@/features/gamification/types";

function parseLb(v: string | string[] | undefined): "7" | "30" | "all" {
  const raw = Array.isArray(v) ? v[0] : v;
  if (raw === "7" || raw === "30" || raw === "all") return raw;
  return "30";
}

function parseScope(v: string | string[] | undefined): LeaderboardScope {
  const raw = Array.isArray(v) ? v[0] : v;
  return raw === "year" ? "year" : "all";
}

export default async function OsiagnieciaPage({
  searchParams,
}: {
  searchParams: Promise<{ lb?: string | string[]; scope?: string | string[] }>;
}) {
  const t = await getTranslations("gamification");
  const sp = await searchParams;
  const period = parseLb(sp.lb);
  const scope = parseScope(sp.scope);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await loadGamification(supabase, user.id, period, scope);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          {t("page.title")}
        </h1>
        <p className="mt-1 font-body text-sm text-secondary">
          {t("page.subtitle")}
        </p>
      </header>

      <PlayerCard
        xp={data.xp}
        displayName={data.displayName}
        initials={data.initials}
        avatarEmoji={data.avatarEmoji}
        streak={data.streak}
        totalQuestionsAnswered={data.totalQuestionsAnswered}
        avgAccuracy={data.avgAccuracy}
        totalStudyMinutes={data.totalStudyMinutes}
      />

      <RankTierTrack xp={data.xp} />

      <AchievementsGrid achievements={data.achievements} />

      <LeaderboardTable
        rows={data.leaderboard}
        period={data.leaderboardPeriod}
        scope={data.leaderboardScope}
        currentYear={data.currentYear}
      />

      <DailyChallengeSection />
    </div>
  );
}
