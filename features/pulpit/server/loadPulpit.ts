import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { countSessionAnswersTodayWarsaw } from "@/features/pulpit/server/countQuestionsToday";
import { loadActivityHeatmap, type ActivityDay } from "@/features/pulpit/server/loadActivityHeatmap";
import { loadProgressHistory, type ProgressPoint } from "@/features/pulpit/server/loadProgressHistory";
import { loadWeakPoints, type WeakPoint } from "@/features/pulpit/server/loadWeakPoints";
import { greetingName } from "@/lib/greetingName";

export type PulpitRecentSession = {
  id: string;
  subjectName: string;
  mode: string;
  completedAt: string;
  accuracy: number | null;
  totalQuestions: number;
  durationSeconds: number | null;
};

export type PulpitData = {
  displayName: string;
  dailyGoal: number;
  questionsToday: number;
  currentStreak: number;
  longestStreak: number;
  dueReviews: number;
  xp: number;
  rankTier: string;
  activityDays: ActivityDay[];
  progressHistory: ProgressPoint[];
  weakPoints: WeakPoint[];
  lastSubjectId: string | null;
  lastSubjectName: string | null;
  lastSubjectMasteryPct: number;
  recentSessions: PulpitRecentSession[];
};

export async function loadPulpit(): Promise<
  { ok: true; data: PulpitData } | { ok: false; message: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { ok: false, message: "Brak aktywnej sesji." };
    }

    const profile = await getProfileByUserId(user.id);
    const displayName = greetingName(profile, user.email);

    const [dueRes, sessionsRes, questionsToday, activityDays, progressHistory, weakPoints] = await Promise.all([
      supabase
        .from("user_question_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("next_review", "is", null)
        .lte("next_review", new Date().toISOString()),
      supabase
        .from("study_sessions")
        .select(
          "id, subject_id, mode, completed_at, accuracy, total_questions, duration_seconds, subjects ( name )",
        )
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false })
        .limit(3),
      countSessionAnswersTodayWarsaw(supabase, user.id),
      loadActivityHeatmap(supabase, user.id),
      loadProgressHistory(supabase, user.id),
      loadWeakPoints(supabase, user.id),
    ]);

    const dailyGoal = profile?.daily_goal ?? 25;

    const recentSessions: PulpitRecentSession[] = (sessionsRes.data ?? []).map(
      (row: Record<string, unknown>) => {
        const sub = row.subjects as { name: string } | { name: string }[] | null;
        const name = Array.isArray(sub) ? sub[0]?.name : sub?.name;
        return {
          id: row.id as string,
          subjectName: (name as string) ?? "Przedmiot",
          mode: row.mode as string,
          completedAt: row.completed_at as string,
          accuracy: (row.accuracy as number) ?? null,
          totalQuestions: (row.total_questions as number) ?? 0,
          durationSeconds: (row.duration_seconds as number) ?? null,
        };
      },
    );

    let lastSubjectId: string | null = null;
    let lastSubjectName: string | null = null;
    let lastSubjectMasteryPct = 0;

    const firstRow = sessionsRes.data?.[0] as { subject_id?: string } | undefined;
    const sid = firstRow?.subject_id;
    if (sid) {
      lastSubjectId = sid;
      lastSubjectName = recentSessions[0]?.subjectName ?? null;
      const { data: topicRows } = await supabase
        .from("topics")
        .select("id")
        .eq("subject_id", sid);
      const topicIds = (topicRows ?? []).map((t) => t.id as string);
      if (topicIds.length > 0) {
        const { data: qrows } = await supabase
          .from("questions")
          .select("id")
          .in("topic_id", topicIds);
        const qids = (qrows ?? []).map((q) => q.id as string);
        if (qids.length > 0) {
          const { data: uqp } = await supabase
            .from("user_question_progress")
            .select("times_answered, times_correct")
            .eq("user_id", user.id)
            .in("question_id", qids);
          let t = 0;
          let c = 0;
          for (const r of uqp ?? []) {
            t += Number(r.times_answered ?? 0);
            c += Number(r.times_correct ?? 0);
          }
          lastSubjectMasteryPct = t > 0 ? Math.round((c / t) * 100) : 0;
        }
      }
    }

    return {
      ok: true,
      data: {
        displayName,
        dailyGoal,
        questionsToday,
        currentStreak: profile?.current_streak ?? 0,
        longestStreak: profile?.longest_streak ?? 0,
        dueReviews: dueRes.count ?? 0,
        xp: profile?.xp ?? 0,
        rankTier: profile?.rank_tier ?? "praktykant",
        activityDays,
        progressHistory,
        weakPoints,
        lastSubjectId,
        lastSubjectName,
        lastSubjectMasteryPct,
        recentSessions,
      },
    };
  } catch (e) {
    console.error("[loadPulpit]", e);
    return { ok: false, message: "Nie udało się wczytać pulpitu." };
  }
}
