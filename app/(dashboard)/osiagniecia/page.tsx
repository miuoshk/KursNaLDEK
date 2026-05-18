import { RankTierTrack } from "@/features/gamification/components/RankTierTrack";
import { PlayerCard } from "@/features/gamification/components/PlayerCard";
import { AchievementsGrid } from "@/features/gamification/components/AchievementsGrid";
import { LeaderboardTable } from "@/features/gamification/components/LeaderboardTable";
import { DailyChallengeSection } from "@/features/gamification/components/DailyChallengeCard";
import { loadGamification } from "@/features/gamification/server/loadGamification";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function parseLb(v: string | string[] | undefined): "7" | "30" | "all" {
  const raw = Array.isArray(v) ? v[0] : v;
  if (raw === "7" || raw === "30" || raw === "all") return raw;
  return "30";
}

export default async function OsiagnieciaPage({
  searchParams,
}: {
  searchParams: Promise<{ lb?: string | string[] }>;
}) {
  const sp = await searchParams;
  const period = parseLb(sp.lb);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await loadGamification(supabase, user.id, period);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          Osiągnięcia
        </h1>
        <p className="mt-1 font-body text-sm text-secondary">
          Rangi, XP i Twój postęp w nauce.
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

      <LeaderboardTable rows={data.leaderboard} period={data.leaderboardPeriod} />

      <DailyChallengeSection />
    </div>
  );
}
