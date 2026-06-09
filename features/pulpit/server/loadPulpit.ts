import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { getDueReviewCount } from "@/lib/dashboard/getDueReviewCount";
import { countSessionAnswersTodayWarsaw } from "@/features/pulpit/server/countQuestionsToday";
import { loadActivityHeatmap, type ActivityDay } from "@/features/pulpit/server/loadActivityHeatmap";
import { loadProgressHistory, type ProgressPoint } from "@/features/pulpit/server/loadProgressHistory";
import { loadWeakPoints, type WeakPoint } from "@/features/pulpit/server/loadWeakPoints";
import { getPreferredSessionCount } from "@/features/session/lib/sessionCount";
import { fetchActiveQuestionsForTopics } from "@/lib/content/fetchActiveQuestionsForTopics";
import { fetchVisibleTopicIds } from "@/features/session/server/questionSelection";
import { getSubjectScopeIds } from "@/features/session/server/sharedSubjects";
import { normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";
import { greetingName } from "@/lib/greetingName";
import { getCachedKnnpCatalog } from "@/features/shared/server/knnpCatalogCache";
import { getDueReviewsPerSubject } from "@/lib/dashboard/getDueReviewsPerSubject";

export type PulpitDueSubject = {
  id: string;
  name: string;
  count: number;
};

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
  /** Przedmioty z co najmniej jedną zaplanowaną powtórką. */
  dueSubjects: PulpitDueSubject[];
  xp: number;
  rankTier: string;
  activityDays: ActivityDay[];
  progressHistory: ProgressPoint[];
  weakPoints: WeakPoint[];
  lastSubjectId: string | null;
  lastSubjectName: string | null;
  lastSubjectMasteryPct: number;
  /** Ostatnia liczba pytań z konfiguracji sesji (10, 25, custom…). */
  preferredSessionCount: number;
  recentSessions: PulpitRecentSession[];
  /** Liczba innych userów aktywnych w ciągu ostatnich 5 minut (heartbeat). */
  activeUsersNow: number;
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
    const track = normalizeTrack(profile?.current_track);
    const year = normalizeYear(profile?.current_year);

    const onlineWindowIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const catalog = await getCachedKnnpCatalog(track, year);
    const [dueReviews, dueReviewsPerSubject, sessionsRes, questionsToday, activityDays, progressHistory, weakPoints, activeNowRes] = await Promise.all([
      getDueReviewCount(supabase, user.id, track, year),
      getDueReviewsPerSubject(supabase, user.id, catalog, track),
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
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_seen_at", onlineWindowIso)
        .neq("id", user.id),
    ]);

    const dailyGoal = profile?.daily_goal ?? 25;
    const preferredSessionCount = getPreferredSessionCount(profile);

    const dueSubjects: PulpitDueSubject[] = catalog.subjectRows
      .map((row) => ({
        id: row.id,
        name: row.name,
        count: dueReviewsPerSubject.get(row.id) ?? 0,
      }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);

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
      const topicIds = await fetchVisibleTopicIds(
        supabase,
        getSubjectScopeIds(sid),
        track,
      );
      if (topicIds.length > 0) {
        const qrows = await fetchActiveQuestionsForTopics(supabase, topicIds, track);
        const qids = qrows.map((q) => q.id);
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
        dueReviews,
        dueSubjects,
        xp: profile?.xp ?? 0,
        rankTier: profile?.rank_tier ?? "praktykant",
        activityDays,
        progressHistory,
        weakPoints,
        lastSubjectId,
        lastSubjectName,
        lastSubjectMasteryPct,
        preferredSessionCount,
        recentSessions,
        activeUsersNow: activeNowRes.count ?? 0,
      },
    };
  } catch (e) {
    console.error("[loadPulpit]", e);
    return { ok: false, message: "Nie udało się wczytać pulpitu." };
  }
}
