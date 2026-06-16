import type { SupabaseClient } from "@supabase/supabase-js";
import { ACHIEVEMENTS } from "@/features/gamification/lib/achievements-config";
import { getCurrentRank } from "@/features/gamification/lib/ranks";
import type {
  GamificationPayload,
  LeaderboardRow,
  LeaderboardScope,
} from "@/features/gamification/types";
import { initialsFromName } from "@/lib/initialsFromName";
import { createAdminClient } from "@/lib/supabase/admin";

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

const LEADERBOARD_LIMIT = 50;

function rankRows(rows: LeaderboardRow[]): LeaderboardRow[] {
  return rows
    .sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return a.displayName.localeCompare(b.displayName, "pl");
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

async function loadLeaderboardRows(
  userId: string,
  leaderboardPeriod: "7" | "30" | "all",
  scope: LeaderboardScope,
  currentYear: number | null,
): Promise<LeaderboardRow[]> {
  try {
    const admin = createAdminClient();
    const since = periodStart(leaderboardPeriod);

    const { data: statsRows, error: statsError } = await admin.rpc(
      "leaderboard_period_stats",
      { p_since: since },
    );

    if (statsError || !statsRows?.length) {
      return [];
    }

    const statsByUser = new Map<
      string,
      { xp: number; correct: number; total: number }
    >();
    for (const row of statsRows) {
      statsByUser.set(row.user_id as string, {
        xp: Number(row.period_xp ?? 0),
        correct: Number(row.period_correct ?? 0),
        total: Number(row.period_total ?? 0),
      });
    }

    const activeUserIds = [...statsByUser.keys()];
    if (!activeUserIds.includes(userId)) {
      activeUserIds.push(userId);
    }

    let profilesQ = admin
      .from("profiles")
      .select(
        "id, nick, display_name, avatar_emoji, xp, current_streak, current_year, last_seen_at",
      )
      .in("id", activeUserIds);

    if (scope === "year" && currentYear != null) {
      profilesQ = profilesQ.eq("current_year", currentYear);
    }

    const { data: profileRows, error: profileError } = await profilesQ;

    if (profileError || !profileRows?.length) {
      return [];
    }

    const isAllTime = leaderboardPeriod === "all";

    const baseRows: LeaderboardRow[] = profileRows
      .map((profile) => {
        const id = profile.id as string;
        const agg = statsByUser.get(id);
        if (!agg || agg.total <= 0) {
          return null;
        }

        const lifetimeXp = profile.xp ?? 0;
        const xp = isAllTime ? lifetimeXp : agg.xp;
        const accuracy = agg.total > 0 ? agg.correct / agg.total : 0;
        const displayName =
          (profile.nick as string | null) ??
          (profile.display_name as string | null) ??
          "Użytkownik";
        const tier = getCurrentRank(lifetimeXp);

        return {
          rank: 0,
          userId: id,
          displayName,
          initials: initialsFromName(displayName),
          avatarEmoji: (profile.avatar_emoji as string | null | undefined) ?? null,
          rankTierId: tier.id,
          rankColorClass: tier.colorClass,
          xp,
          accuracy,
          streak: profile.current_streak ?? 0,
          questionsAnswered: agg.total,
          lastSeenAt:
            (profile as { last_seen_at?: string | null }).last_seen_at ?? null,
          isCurrent: id === userId,
        };
      })
      .filter((row): row is LeaderboardRow => row != null);

    const ranked = rankRows(baseRows);
    const topRows = ranked.slice(0, LEADERBOARD_LIMIT);
    const hasCurrentUser = topRows.some((row) => row.userId === userId);
    if (hasCurrentUser) {
      return topRows;
    }

    const currentUserRow = ranked.find((row) => row.userId === userId);
    if (!currentUserRow) {
      return topRows;
    }
    return [...topRows, currentUserRow];
  } catch {
    return [];
  }
}

export async function loadGamification(
  supabase: SupabaseClient,
  userId: string,
  leaderboardPeriod: "7" | "30" | "all" = "30",
  leaderboardScope: LeaderboardScope = "all",
): Promise<GamificationPayload> {
  const since = periodStart(leaderboardPeriod);

  const [{ data: profile }, { data: uqp }] = await Promise.all([
    supabase
      .from("profiles")
      .select("xp, current_streak, nick, display_name, avatar_emoji, current_year")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_question_progress")
      .select("times_answered, times_correct")
      .eq("user_id", userId),
  ]);

  const currentYear =
    (profile as { current_year?: number | null } | null)?.current_year ?? null;

  const displayName = profile?.nick ?? profile?.display_name ?? "Użytkownik";
  const initials = initialsFromName(displayName);
  const avatarEmoji =
    (profile as { avatar_emoji?: string | null } | null)?.avatar_emoji ?? null;
  const xp = profile?.xp ?? 0;
  const streak = profile?.current_streak ?? 0;

  let totalAttempts = 0;
  let totalCorrect = 0;
  let uniqueAnswered = 0;
  for (const r of uqp ?? []) {
    const ta = r.times_answered ?? 0;
    totalAttempts += ta;
    totalCorrect += r.times_correct ?? 0;
    if (ta > 0) uniqueAnswered += 1;
  }
  const avgAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

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
      progress = Math.min(def.targetValue, totalAttempts);
      unlocked = totalAttempts >= def.targetValue;
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
    avatarEmoji,
    rankTierId: rank.id,
    rankColorClass: rank.colorClass,
    xp: lbXp,
    accuracy: lbAcc,
    streak,
    questionsAnswered: uniqueAnswered,
    lastSeenAt: new Date().toISOString(),
    isCurrent: true,
  };

  const effectiveScope: LeaderboardScope =
    leaderboardScope === "year" && currentYear != null ? "year" : "all";

  const leaderboardRows = await loadLeaderboardRows(
    userId,
    leaderboardPeriod,
    effectiveScope,
    currentYear,
  );

  return {
    xp,
    displayName,
    initials,
    avatarEmoji,
    streak,
    totalQuestionsAnswered: uniqueAnswered,
    avgAccuracy,
    totalStudyMinutes,
    achievements,
    leaderboard: leaderboardRows.length > 0 ? leaderboardRows : [lbRow],
    leaderboardPeriod,
    leaderboardScope: effectiveScope,
    currentYear,
  };
}
