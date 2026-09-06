"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireLearningAccessForSubject } from "@/features/access/server/requireLearningAccess";
import { computeSessionXp } from "@/features/session/server/computeSessionXp";
import { buildSessionSummary } from "@/features/session/server/sessionSummaryBuilder";
import {
  nextStreakValues,
  todayDateString,
} from "@/features/session/server/sessionStreak";
import {
  SESSION_ANSWER_ANTARES_SELECT,
  computeAndStoreSessionInsights,
  mapAnswerRowsForPostAntares,
} from "@/features/session/server/completeSessionPostAntares";
import { refreshReadinessPercentileCache } from "@/features/statistics/server/refreshReadinessPercentileCache";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import { createPerfSpan, logPerf, vercelRuntimeMeta } from "@/features/session/lib/perfLog";
import { parseCompleteSessionPayload } from "@/features/session/lib/parseCompleteSessionPayload";
import { headers } from "next/headers";

export type CompleteSessionResult =
  { ok: true; summary: SessionSummaryData } | { ok: false; message: string };

export async function completeSession(
  raw: {
    sessionId: string;
    durationSecondsFallback?: number;
    feedbackEvents?: unknown;
  },
): Promise<CompleteSessionResult> {
  const span = createPerfSpan("completeSession HTTP");
  const extra: Record<string, unknown> = { sessionId: raw.sessionId };
  try {
    extra.xVercelId = (await headers()).get("x-vercel-id");
  } catch {
    extra.xVercelId = null;
  }

  const t = await getTranslations("session");
  span.mark("getTranslations");
  const parsed = parseCompleteSessionPayload(raw);
  if (!parsed.ok) {
    extra.ok = false;
    span.end(extra);
    return { ok: false, message: t("errors.invalidData") };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    span.mark("createClient+getUser");

    if (authError || !user) {
      extra.ok = false;
      span.end(extra);
      return { ok: false, message: t("errors.noAuthSession") };
    }

    const { data: session, error: se } = await supabase
      .from("study_sessions")
      .select(
        "id, user_id, subject_id, total_questions, correct_answers, duration_seconds, is_completed, mode, feedback_experiment_variant, engine_variant, memory_parameter_set_id",
      )
      .eq("id", parsed.data.sessionId)
      .eq("user_id", user.id)
      .maybeSingle();
    span.mark("study_sessions.select");

    if (se || !session) {
      extra.ok = false;
      span.end(extra);
      return { ok: false, message: t("errors.sessionNotFound") };
    }

    const access = await requireLearningAccessForSubject(
      user.id,
      session.subject_id as string,
    );
    span.mark("requireLearningAccess");
    if (!access.ok) {
      extra.ok = false;
      span.end(extra);
      return { ok: false, message: access.message };
    }

    if (session.is_completed) {
      let summary = await buildSessionSummary(
        supabase,
        parsed.data.sessionId,
        user.id,
      );
      span.mark("buildSessionSummary already-completed");
      extra.alreadyCompleted = true;
      if (!summary) {
        extra.ok = false;
        span.end(extra);
        return { ok: false, message: t("errors.loadSummaryFailed") };
      }
      if (!summary.sessionInsights && !summary.examReadiness) {
        try {
          const recoverAdmin = createAdminClient();
          const { data: rows } = await recoverAdmin
            .from("session_answers")
            .select(SESSION_ANSWER_ANTARES_SELECT)
            .eq("session_id", session.id);
          const recovered = mapAnswerRowsForPostAntares(rows ?? []);
          if (recovered.length > 0) {
            await computeAndStoreSessionInsights(recoverAdmin, {
              userId: user.id,
              sessionId: session.id as string,
              ansRows: recovered,
              answeredCount: recovered.length,
              adaptiveFeedbackEnabled:
                session.feedback_experiment_variant === "treatment",
              engineVariant:
                session.engine_variant === "treatment" ? "treatment" : "shadow",
              parameterSetId:
                (session.memory_parameter_set_id as string | null) ?? null,
            });
            summary =
              (await buildSessionSummary(
                supabase,
                parsed.data.sessionId,
                user.id,
              )) ?? summary;
          }
        } catch (err) {
          console.error("[completeSession] insights recovery", err);
        }
      }
      extra.ok = true;
      span.end(extra);
      return { ok: true, summary };
    }

    const [
      { count: completedBefore },
      { data: ansRowsRaw },
      { data: profile },
    ] = await Promise.all([
      supabase
        .from("study_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_completed", true),
      supabase
        .from("session_answers")
        .select(
          "question_id, is_correct, question_order, time_spent_seconds, feedback_dwell_seconds, confidence, answered_at, retrievability_before, retrievability_after",
        )
        .eq("session_id", parsed.data.sessionId),
      supabase
        .from("profiles")
        .select(
          "xp, current_streak, longest_streak, last_active_date, avg_session_hour, average_question_seconds",
        )
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    span.mark("count+answers+profile");

    if (!profile) {
      extra.ok = false;
      span.end(extra);
      return { ok: false, message: t("errors.noProfile") };
    }

    const isFirstSessionEver = (completedBefore ?? 0) === 0;

    const ansRows = [...(ansRowsRaw ?? [])].sort(
      (a, b) => (a.question_order ?? 0) - (b.question_order ?? 0),
    );

    const forXp = ansRows.map((a) => ({
      is_correct: a.is_correct as boolean,
    }));

    const xpEarned = computeSessionXp(
      forXp,
      session.total_questions ?? ansRows.length,
    );

    const sumDur =
      ansRows.reduce(
        (sum, answer) =>
          sum +
          (answer.time_spent_seconds ?? 0) +
          (answer.feedback_dwell_seconds ?? 0),
        0,
      ) ||
      parsed.data.durationSecondsFallback ||
      0;

    const answeredCount = ansRows.length;
    const correct = session.correct_answers ?? 0;
    const accuracy = answeredCount > 0 ? correct / answeredCount : 0;
    const previousQuestionSeconds = Number(profile.average_question_seconds);
    const observedQuestionSeconds =
      answeredCount > 0
        ? Math.min(600, Math.max(5, sumDur / answeredCount))
        : 0;
    const averageQuestionSeconds =
      observedQuestionSeconds > 0
        ? Number.isFinite(previousQuestionSeconds) &&
          previousQuestionSeconds > 0
          ? previousQuestionSeconds * 0.8 + observedQuestionSeconds * 0.2
          : observedQuestionSeconds
        : null;

    const { streak: newStreak } = nextStreakValues(
      profile.last_active_date as string | null,
      profile.current_streak ?? 0,
    );
    const newLongest = Math.max(newStreak, profile.longest_streak ?? 0);

    const admin = createAdminClient();
    const [upSessRes, upProfRes] = await Promise.all([
      admin
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
          ...(averageQuestionSeconds != null
            ? { average_question_seconds: averageQuestionSeconds }
            : {}),
        })
        .eq("id", user.id),
    ]);
    span.mark("update session+profile");

    if (upSessRes.error) {
      console.error(
        "[completeSession] study_sessions",
        upSessRes.error.message,
      );
      extra.ok = false;
      span.end(extra);
      return { ok: false, message: t("errors.closeSessionFailed") };
    }
    if (upProfRes.error) {
      console.error("[completeSession] profiles", upProfRes.error.message);
      extra.ok = false;
      span.end(extra);
      return { ok: false, message: t("errors.updateProfileFailed") };
    }

    const postAnsRows = mapAnswerRowsForPostAntares(ansRows);
    const sessionMode = session.mode as string;
    const needsSyncTips =
      sessionMode === "inteligentna" || sessionMode === "nauka";
    let insightsWritten = false;
    if (postAnsRows.length > 0 && needsSyncTips) {
      try {
        const written = await computeAndStoreSessionInsights(admin, {
          userId: user.id,
          sessionId: session.id as string,
          ansRows: postAnsRows,
          answeredCount,
          adaptiveFeedbackEnabled:
            session.feedback_experiment_variant === "treatment",
          engineVariant:
            session.engine_variant === "treatment" ? "treatment" : "shadow",
          parameterSetId:
            (session.memory_parameter_set_id as string | null) ?? null,
          phase: "tips",
        });
        insightsWritten = written != null;
      } catch (err) {
        console.error("[completeSession] postAntares (tips)", err);
      }
      span.mark("postAntares tips");
    }

    const [summary, profAfter] = await Promise.all([
      buildSessionSummary(supabase, parsed.data.sessionId, user.id),
      supabase
        .from("profiles")
        .select("xp, current_streak")
        .eq("id", user.id)
        .single(),
    ]);
    span.mark("buildSessionSummary+profileAfter");

    if (!summary) {
      extra.ok = false;
      span.end(extra);
      return { ok: false, message: t("errors.buildSummaryFailed") };
    }

    summary.xpEarned = xpEarned;
    summary.achievementUnlocked = isFirstSessionEver
      ? t("achievementFirstSession")
      : null;
    summary.previousStreakDays = profile.current_streak ?? 0;

    if (profAfter.data) {
      summary.newXpTotal = profAfter.data.xp ?? summary.newXpTotal;
      summary.newStreak = profAfter.data.current_streak ?? summary.newStreak;
    }

    revalidatePath("/przedmioty", "layout");
    revalidatePath("/pulpit", "page");
    span.mark("revalidatePath");

    // ═══════════════════════════════════════════════════════════
    // FAZA BACKGROUND — po response (next/after), nie blokuje UI
    // avg_session_hour, learning_velocity, learning_event
    // ═══════════════════════════════════════════════════════════

    const bgSessionId = session.id as string;
    const bgUserId = user.id;
    const bgSubjectId = session.subject_id as string | null;
    const bgFeedbackEvents = parsed.data.feedbackEvents ?? [];
    const bgAvgSessionHour = profile.avg_session_hour as
      number | null | undefined;
    const bgTotalQuestions = session.total_questions ?? answeredCount;

    // 0 until HTTP return is logged. If after() runs earlier, delta uses 0.
    let httpReturnAt = 0;

    after(async () => {
      const afterStartAt = Date.now();
      logPerf("completeSession after() start", {
        sessionId: bgSessionId,
        afterStartAt,
        httpReturnAt,
        deltaFromHttpReturnMs: afterStartAt - httpReturnAt,
        httpReturnWasUnset: httpReturnAt === 0,
        tipsWrittenInRequest: insightsWritten,
        ...vercelRuntimeMeta(),
      });
      const afterSpan = createPerfSpan("completeSession after()");
      try {
        const bgAdmin = createAdminClient();
        // Mastery + exam — ciężkie, nie blokują HTTP. Wskazówki (tips)
        // zapisaliśmy w requestcie; tu dociągamy resztę albo odzyskujemy całość.
        if (postAnsRows.length > 0) {
          try {
            await computeAndStoreSessionInsights(bgAdmin, {
              userId: bgUserId,
              sessionId: bgSessionId,
              ansRows: postAnsRows,
              answeredCount,
              adaptiveFeedbackEnabled:
                session.feedback_experiment_variant === "treatment",
              engineVariant:
                session.engine_variant === "treatment" ? "treatment" : "shadow",
              parameterSetId:
                (session.memory_parameter_set_id as string | null) ?? null,
              phase: "full",
            });
            afterSpan.mark("postAntares mastery+exam");
          } catch (err) {
            console.error("[completeSession] postAntares (bg)", err);
          }
        }

        // Percentyl kohorty (readiness_*) — tylko na /statystyki, liczony po
        // odpowiedzi żeby nie wydłużać ekranu podsumowania.
        await refreshReadinessPercentileCache(bgAdmin, bgUserId);

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
            bgAdmin
              .from("learning_events")
              .select("id", { count: "exact", head: true })
              .eq("user_id", bgUserId)
              .eq("event_type", "answer")
              .gte("created_at", sevenDaysAgoIso),
            bgAdmin
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

        const feedbackRows =
          bgFeedbackEvents.length === 0
            ? []
            : await (async () => {
                const qids = [
                  ...new Set(bgFeedbackEvents.map((event) => event.questionId)),
                ];
                const { data: topicRows } = await bgAdmin
                  .from("questions")
                  .select("id, topic_id")
                  .in("id", qids);
                const topicByQ = new Map(
                  (topicRows ?? []).map((row) => [
                    row.id as string,
                    (row.topic_id as string | null) ?? null,
                  ]),
                );
                return bgFeedbackEvents.map((event) => ({
                  user_id: bgUserId,
                  event_type: event.eventType,
                  event_schema_version: 2,
                  session_id: bgSessionId,
                  question_id: event.questionId,
                  subject_id: bgSubjectId,
                  topic_id: topicByQ.get(event.questionId) ?? null,
                  payload: event.payload,
                }));
              })();

        await bgAdmin.from("learning_events").insert([
          ...feedbackRows,
          {
            user_id: bgUserId,
            event_type: "session_end",
            payload: {
              session_id: bgSessionId,
              accuracy,
              duration_seconds: sumDur,
              total_questions: bgTotalQuestions,
              correct_answers: correct,
            },
          },
        ]);
        afterSpan.end({ sessionId: bgSessionId, ok: true });
      } catch (err) {
        afterSpan.end({ sessionId: bgSessionId, ok: false });
        console.error("[completeSession background]", err);
      }
    });

    httpReturnAt = Date.now();
    extra.ok = true;
    extra.httpReturnAt = httpReturnAt;
    span.end(extra);
    return { ok: true, summary };
  } catch (e) {
    console.error("[completeSession]", e);
    extra.ok = false;
    span.end(extra);
    return { ok: false, message: t("errors.unexpected") };
  }
}
