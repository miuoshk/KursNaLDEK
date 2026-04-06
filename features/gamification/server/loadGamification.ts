import type { SupabaseClient } from "@supabase/supabase-js";
import { ACHIEVEMENTS } from "@/features/gamification/lib/achievements-config";
import { getCurrentRank } from "@/features/gamification/lib/ranks";
import type { GamificationPayload, LeaderboardRow } from "@/features/gamification/types";
import { initialsFromName } from "@/lib/initialsFromName";

function periodStart(p: "7" | "30" | "all"): string | null {
  if (p === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - (p === "7" ? 7 : 30));
  return d.toISOString();
}

const TRACKED_IDS = new Set([
  "pierwsza-sesja",
  "setka",
  "tysiac",
  "tygodniowy-rytm",
  "miesieczna-dyscyplina",
  "kwartalna-konsekwencja",
]);

export async function loadGamification(
  supabase: SupabaseClient,
  userId: string,
  leaderboardPeriod: "7" | "30" | "all" = "30",
): Promise<GamificationPayload> {
  const since = periodStart(leaderboardPeriod);

  const [{ data: profile }, { data: uqp }] = await Promise.all([
    supabase
      .from("profiles")
      .select("xp, current_streak, display_name")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_question_progress")
      .select("times_answered, times_correct")
      .eq("user_id", userId),
  ]);

  const displayName = profile?.display_name ?? "Użytkownik";
  const initials = initialsFromName(displayName);
  const xp = profile?.xp ?? 0;
  const streak = profile?.current_streak ?? 0;

  let totalAnswered = 0;
  let totalCorrect = 0;
  for (const r of uqp ?? []) {
    totalAnswered += r.times_answered ?? 0;
    totalCorrect += r.times_correct ?? 0;
  }
  const avgAccuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;

  const { data: lifeSess } = await supabase
    .from("study_sessions")
    .select("duration_seconds")
    .eq("user_id", userId)
    .eq("is_completed", true);
  const totalStudyMinutes = Math.round(
    (lifeSess ?? []).reduce((s, x) => s + (x.duration_seconds ?? 0) / 60, 0),
  );

  let xpQ = supabase
    .from("study_sessions")
    .select("correct_answers, total_questions, xp_earned")
    .eq("user_id", userId)
    .eq("is_completed", true);
  if (since) xpQ = xpQ.gte("completed_at", since);
  const { data: sessions } = await xpQ;
  const periodXp = (sessions ?? []).reduce((s, x) => s + (x.xp_earned ?? 0), 0);
  let periodCorrect = 0;
  let periodTotal = 0;
  for (const s of sessions ?? []) {
    periodCorrect += s.correct_answers ?? 0;
    periodTotal += s.total_questions ?? 0;
  }
  const periodAccuracy = periodTotal > 0 ? periodCorrect / periodTotal : 0;

  const { data: uaRows } = await supabase
    .from("user_achievements")
    .select("achievement_id, progress, unlocked, unlocked_at")
    .eq("user_id", userId);

  const uaMap = new Map(
    (uaRows ?? []).map((r) => [r.achievement_id as string, r]),
  );

  const { count: completedSessions } = await supabase
    .from("study_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_completed", true);

  const achievements = ACHIEVEMENTS.map((def) => {
    const row = uaMap.get(def.id);
    let progress = row?.progress ?? 0;
    let unlocked = row?.unlocked ?? false;

    if (def.id === "pierwsza-sesja") {
      progress = Math.min(1, completedSessions ?? 0);
      unlocked = (completedSessions ?? 0) >= 1;
    }
    if (def.id === "setka" || def.id === "tysiac") {
      progress = Math.min(def.targetValue, totalAnswered);
      unlocked = totalAnswered >= def.targetValue;
    }
    if (
      def.id === "tygodniowy-rytm" ||
      def.id === "miesieczna-dyscyplina" ||
      def.id === "kwartalna-konsekwencja"
    ) {
      progress = Math.min(def.targetValue, streak);
      unlocked = streak >= def.targetValue;
    }

    const locked =
      !unlocked && !TRACKED_IDS.has(def.id) && !(row?.progress && row.progress > 0);

    return {
      ...def,
      progress,
      unlocked,
      unlockedAt: unlocked ? (row?.unlocked_at as string | null) ?? null : null,
      locked,
    };
  });

  const rank = getCurrentRank(xp);
  const lbXp = leaderboardPeriod === "all" ? xp : periodXp;
  const lbAcc = leaderboardPeriod === "all" ? avgAccuracy : periodAccuracy;

  const lbRow: LeaderboardRow = {
    rank: 1,
    userId,
    displayName,
    initials,
    rankName: rank.name,
    rankColorClass: rank.colorClass,
    xp: lbXp,
    accuracy: lbAcc,
    streak,
    isCurrent: true,
  };

  return {
    xp,
    displayName,
    initials,
    streak,
    totalQuestionsAnswered: totalAnswered,
    avgAccuracy,
    totalStudyMinutes,
    achievements,
    leaderboard: [lbRow],
    leaderboardPeriod,
  };
}
