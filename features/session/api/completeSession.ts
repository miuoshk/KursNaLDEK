"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { computeSessionXp } from "@/features/session/server/computeSessionXp";
import { buildSessionSummary } from "@/features/session/server/sessionSummaryBuilder";
import { nextStreakValues, todayDateString } from "@/features/session/server/sessionStreak";
import { runCompleteSessionPostAntares } from "@/features/session/server/completeSessionPostAntares";
import { refreshReadinessPercentileCache } from "@/features/statistics/server/refreshReadinessPercentileCache";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

const schema = z.object({
  sessionId: z.string().uuid(),
  durationSecondsFallback: z.number().int().min(0).optional(),
});

export type CompleteSessionResult =
  | { ok: true; summary: SessionSummaryData }
  | { ok: false; message: string };

export async function completeSession(
  raw: z.infer<typeof schema>,
): Promise<CompleteSessionResult> {
  const t = await getTranslations("session");
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: t("errors.invalidData") };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: t("errors.noAuthSession") };
    }

    const { data: session, error: se } = await supabase
      .from("study_sessions")
      .select(
        "id, user_id, subject_id, total_questions, correct_answers, duration_seconds, is_completed, started_at",
      )
      .eq("id", parsed.data.sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (se || !session) {
      return { ok: false, message: t("errors.sessionNotFound") };
    }

    if (session.is_completed) {
      const summary = await buildSessionSummary(
        supabase,
        parsed.data.sessionId,
        user.id,
      );
      if (!summary) {
        return { ok: false, message: t("errors.loadSummaryFailed") };
      }
      return { ok: true, summary };
    }

    const [{ count: completedBefore }, { data: ansRowsRaw }, { data: profile }] =
      await Promise.all([
        supabase
          .from("study_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_completed", true),
        supabase
          .from("session_answers")
          .select(
            "question_id, is_correct, question_order, time_spent_seconds, confidence, answered_at",
          )
          .eq("session_id", parsed.data.sessionId),
        supabase
          .from("profiles")
          .select("xp, current_streak, longest_streak, last_active_date, avg_session_hour")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

    if (!profile) {
      return { ok: false, message: t("errors.noProfile") };
    }

    const isFirstSessionEver = (completedBefore ?? 0) === 0;

    const ansRows = [...(ansRowsRaw ?? [])].sort(
      (a, b) => (a.question_order ?? 0) - (b.question_order ?? 0),
    );

    const qids = [...new Set(ansRows.map((a) => a.question_id as string))];

    const forXp = ansRows.map((a) => ({
      is_correct: a.is_correct as boolean,
    }));

    const xpEarned = computeSessionXp(
      forXp,
      session.total_questions ?? ansRows.length,
    );

    const sumDur =
      ansRows.reduce((s, r) => s + (r.time_spent_seconds ?? 0), 0) ||
      parsed.data.durationSecondsFallback ||
      0;

    const answeredCount = ansRows.length;
    const correct = session.correct_answers ?? 0;
    const accuracy = answeredCount > 0 ? correct / answeredCount : 0;

    const { streak: newStreak } = nextStreakValues(
      profile.last_active_date as string | null,
      profile.current_streak ?? 0,
    );
    const newLongest = Math.max(newStreak, profile.longest_streak ?? 0);

    const admin = createAdminClient();
    const [upSessRes, upProfRes] = await Promise.all([
      supabase
        .from("study_sessions")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          accuracy,
          duration_seconds: sumDur,
          xp_earned: xpEarned,
        })
        .eq("id", session.id),
      admin
        .from("profiles")
        .update({
          xp: (profile.xp ?? 0) + xpEarned,
          current_streak: newStreak,
          longest_streak: newLongest,
          last_active_date: todayDateString(),
        })
        .eq("id", user.id),
    ]);

    if (upSessRes.error) {
      console.error("[completeSession] study_sessions", upSessRes.error.message);
      return { ok: false, message: t("errors.closeSessionFailed") };
    }
    if (upProfRes.error) {
      console.error("[completeSession] profiles", upProfRes.error.message);
      return { ok: false, message: t("errors.updateProfileFailed") };
    }

    // ═══════════════════════════════════════════════════════════
    // ANTARES — synchronicznie (serverless ucina fire-and-forget)
    // mastery, sessionInsights, examReadiness → potem summary z DB
    // ═══════════════════════════════════════════════════════════

    const sessionStartedAt =
      (session.started_at as string | null) ?? new Date().toISOString();
    const postAnsRows = ansRows.map((a) => ({
      question_id: a.question_id as string,
      is_correct: Boolean(a.is_correct),
      confidence: (a.confidence as string | null) ?? null,
      time_spent_seconds: (a.time_spent_seconds as number | null) ?? null,
      question_order: (a.question_order as number | null) ?? null,
      answered_at: (a.answered_at as string | null) ?? null,
    }));

    if (postAnsRows.length > 0) {
      try {
        const { data: topicRows, error: topicErr } = await supabase
          .from("session_answers")
          .select("questions!inner(topic_id)")
          .eq("session_id", session.id);

        if (topicErr) throw topicErr;

        const affectedTopicIds = [
          ...new Set(
            (topicRows ?? [])
              .map((r) => {
                const q = r.questions as unknown as {
                  topic_id: string;
                } | null;
                return q?.topic_id;
              })
              .filter((id): id is string => Boolean(id)),
          ),
        ];

        await runCompleteSessionPostAntares(
          supabase,
          user.id,
          session.id as string,
          sessionStartedAt,
          affectedTopicIds,
          postAnsRows,
          answeredCount,
        );
      } catch (err) {
        console.error("[completeSession] postAntares", err);
      }
    }

    const [summary, profAfter] = await Promise.all([
      buildSessionSummary(supabase, parsed.data.sessionId, user.id),
      supabase.from("profiles").select("xp, current_streak").eq("id", user.id).single(),
    ]);

    if (!summary) {
      return { ok: false, message: t("errors.buildSummaryFailed") };
    }

    summary.xpEarned = xpEarned;
    summary.achievementUnlocked = isFirstSessionEver ? t("achievementFirstSession") : null;
    summary.previousStreakDays = profile.current_streak ?? 0;

    if (profAfter.data) {
      summary.newXpTotal = profAfter.data.xp ?? summary.newXpTotal;
      summary.newStreak = profAfter.data.current_streak ?? summary.newStreak;
    }

    revalidatePath("/przedmioty", "layout");
    revalidatePath("/pulpit", "page");

    // ═══════════════════════════════════════════════════════════
    // FAZA BACKGROUND — po response (next/after), nie blokuje UI
    // avg_session_hour, learning_velocity, learning_event
    // ═══════════════════════════════════════════════════════════

    const bgSessionId = session.id as string;
    const bgUserId = user.id;
    const bgAvgSessionHour = profile.avg_session_hour as number | null | undefined;
    const bgTotalQuestions = session.total_questions ?? answeredCount;

    after(async () => {
      try {
        // Percentyl kohorty (readiness_*) — tylko na /statystyki, liczony po
        // odpowiedzi żeby nie wydłużać ekranu podsumowania.
        await refreshReadinessPercentileCache(supabase, bgUserId);

        const bgAdmin = createAdminClient();
        const now = new Date();
        const currentHour =
          now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
        const rawOld = bgAvgSessionHour;
        const oldAvg =
          rawOld != null && Number.isFinite(Number(rawOld))
            ? Number(rawOld)
            : null;
        const newAvg =
          oldAvg != null ? oldAvg * 0.8 + currentHour * 0.2 : currentHour;

        await bgAdmin
          .from("profiles")
          .update({ avg_session_hour: newAvg })
          .eq("id", bgUserId);

        const t = Date.now();
        const sevenDaysAgoIso = new Date(
          t - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const fourteenDaysAgoIso = new Date(
          t - 14 * 24 * 60 * 60 * 1000,
        ).toISOString();

        const [{ count: thisWeekCount }, { count: lastWeekCount }] =
          await Promise.all([
            supabase
              .from("learning_events")
              .select("id", { count: "exact", head: true })
              .eq("user_id", bgUserId)
              .eq("event_type", "answer")
              .gte("created_at", sevenDaysAgoIso),
            supabase
              .from("learning_events")
              .select("id", { count: "exact", head: true })
              .eq("user_id", bgUserId)
              .eq("event_type", "answer")
              .gte("created_at", fourteenDaysAgoIso)
              .lt("created_at", sevenDaysAgoIso),
          ]);

        const thisWeek = thisWeekCount ?? 0;
        const lastWeek = lastWeekCount ?? 0;
        const velocity =
          lastWeek > 0
            ? Math.min(5.0, Math.max(0.1, thisWeek / lastWeek))
            : thisWeek > 0
              ? 1.0
              : 1.0;

        await bgAdmin
          .from("profiles")
          .update({ learning_velocity: velocity })
          .eq("id", bgUserId);

        await supabase.from("learning_events").insert({
          user_id: bgUserId,
          event_type: "session_end",
          payload: {
            session_id: bgSessionId,
            accuracy,
            duration_seconds: sumDur,
            total_questions: bgTotalQuestions,
            correct_answers: correct,
          },
        });
      } catch (err) {
        console.error("[completeSession background]", err);
      }
    });

    return { ok: true, summary };
  } catch (e) {
    console.error("[completeSession]", e);
    return { ok: false, message: t("errors.unexpected") };
  }
}
