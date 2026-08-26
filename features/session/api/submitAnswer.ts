"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireLearningAccessForSubject } from "@/features/access/server/requireLearningAccess";
import {
  persistUserProgressFsrs,
  type PersistedFsrsReview,
} from "@/features/session/server/persistUserProgressFsrs";
import {
  classifyAttemptRating,
  LEGACY_SCHEDULER_VERSION,
  MEMORY_SCHEDULER_VERSION,
  ratingToLabel,
} from "@/features/session/lib/memory/scheduler";
import { loadMemoryParameterSetById } from "@/features/session/server/loadMemorySchedulerConfig";
import { persistShadowMemoryV2 } from "@/features/session/server/persistShadowMemoryV2";

const schema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  confidence: z.enum(["nie_wiedzialem", "troche", "na_pewno"]).nullable(),
  timeSpentSeconds: z.number().int().min(0).optional(),
  questionOrder: z.number().int().min(0),
  feedbackVariant: z
    .enum(["concise", "standard", "remedial"])
    .nullable()
    .optional(),
  feedbackDwellSeconds: z.number().min(0).max(3600).nullable().optional(),
  /** Ignorowane od event schema v2; pozostawione dla klientów z poprzedniego deployu. */
  skipFsrs: z.boolean().optional(),
});

export type SubmitAnswerResult = { ok: true } | { ok: false; message: string };

function reviewFromStoredAnswer(
  row: Record<string, unknown>,
): PersistedFsrsReview | null {
  const rating = Number(row.fsrs_rating);
  if (![1, 2, 3, 4].includes(rating)) return null;
  const ratingSource =
    row.rating_source === "explicit" ? "explicit" : "observed";
  const snapshot = (phase: "before" | "after") => {
    const stored = row[`fsrs_snapshot_${phase}`];
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      return stored as PersistedFsrsReview[typeof phase];
    }
    return {
      state: String(row[`state_${phase}`] ?? "new"),
      stability: Number(row[`stability_${phase}`] ?? 0),
      difficulty: Number(row[`difficulty_${phase}`] ?? 0),
      elapsedDays: 0,
      scheduledDays: 0,
      learningSteps: 0,
      reps: 0,
      lapses: 0,
      due: (row[`due_${phase}`] as string | null) ?? null,
      lastReview:
        phase === "after" ? ((row.answered_at as string | null) ?? null) : null,
      retrievability: Number(row[`retrievability_${phase}`] ?? 0),
    };
  };
  return {
    applied: true,
    rating,
    ratingSource,
    before: snapshot("before"),
    after: snapshot("after"),
  };
}

function snapshotToProgress(
  snapshot: PersistedFsrsReview["before"],
): Record<string, unknown> {
  return {
    state: snapshot.state,
    stability: snapshot.stability,
    difficulty_rating: snapshot.difficulty,
    elapsed_days: snapshot.elapsedDays,
    scheduled_days: snapshot.scheduledDays,
    learning_steps: snapshot.learningSteps,
    reps: snapshot.reps,
    lapses: snapshot.lapses,
    next_review: snapshot.due,
    last_answered_at: snapshot.lastReview,
  };
}

export async function submitAnswer(
  raw: z.infer<typeof schema>,
  retryDepth = 0,
): Promise<SubmitAnswerResult> {
  const t = await getTranslations("session");
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: t("errors.invalidAnswerData") };
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
        "id, user_id, subject_id, mode, session_kind, scheduler_version, engine_variant, memory_parameter_set_id, target_retention, maximum_interval, total_questions, question_ids, reserve_question_ids, experiment_key, experiment_bucket, experiment_rollout_percent, feedback_experiment_variant, is_completed",
      )
      .eq("id", parsed.data.sessionId)
      .maybeSingle();

    if (se || !session || session.user_id !== user.id) {
      return { ok: false, message: t("errors.sessionNotFound") };
    }

    const access = await requireLearningAccessForSubject(
      user.id,
      session.subject_id as string,
    );
    if (!access.ok) {
      return { ok: false, message: access.message };
    }

    const { data: questionRow, error: questionError } = await supabase
      .from("questions")
      .select("correct_option_id, topic_id")
      .eq("id", parsed.data.questionId)
      .maybeSingle();

    if (questionError || !questionRow?.correct_option_id) {
      return { ok: false, message: t("errors.questionNotFound") };
    }

    const sessionQuestionIds = (session.question_ids as string[] | null) ?? [];
    const reserveQuestionIds =
      (session.reserve_question_ids as string[] | null) ?? [];
    if (
      !sessionQuestionIds.includes(parsed.data.questionId) &&
      !reserveQuestionIds.includes(parsed.data.questionId)
    ) {
      return { ok: false, message: t("errors.questionNotFound") };
    }
    if (parsed.data.questionOrder >= Number(session.total_questions ?? 0)) {
      return { ok: false, message: t("errors.invalidAnswerData") };
    }

    let selectedOptionId = parsed.data.selectedOptionId;
    let isCorrect = questionRow.correct_option_id === selectedOptionId;
    const sessionKind =
      (session.session_kind as string | null) ??
      (session.mode === "nauka" ? "intelligent" : "classic");
    let effectiveConfidence =
      sessionKind === "classic" ? null : parsed.data.confidence;
    let answeredAt = new Date();

    const { data: prevAns } = await supabase
      .from("session_answers")
      .select(
        "id, selected_option_id, is_correct, confidence, time_spent_seconds, answered_at, is_first_exposure, fsrs_applied, fsrs_rating, rating_source, state_before, state_after, retrievability_before, retrievability_after, stability_before, stability_after, difficulty_before, difficulty_after, fsrs_snapshot_before, fsrs_snapshot_after, due_before, due_after, feedback_variant, feedback_dwell_seconds, processing_completed_at",
      )
      .eq("session_id", parsed.data.sessionId)
      .eq("question_id", parsed.data.questionId)
      .maybeSingle();

    // session_answers jest dziennikiem append-only. Ponowne wysłanie (retry po
    // utracie odpowiedzi HTTP) nie może zmienić odpowiedzi ani naliczyć modelu
    // pamięci drugi raz.
    const storedReview = prevAns?.fsrs_applied
      ? reviewFromStoredAnswer(prevAns as Record<string, unknown>)
      : null;
    if (prevAns?.fsrs_applied && !storedReview) {
      return { ok: false, message: t("errors.saveAnswerFailed") };
    }
    if (prevAns) {
      selectedOptionId = String(prevAns.selected_option_id);
      isCorrect = Boolean(prevAns.is_correct);
      effectiveConfidence =
        sessionKind === "classic"
          ? null
          : (prevAns.confidence as typeof effectiveConfidence);
      answeredAt = new Date(prevAns.answered_at as string);
    }
    if (session.is_completed && !prevAns) {
      return { ok: false, message: t("errors.sessionAlreadyCompleted") };
    }

    const attemptRating = classifyAttemptRating(isCorrect, effectiveConfidence);
    const admin = createAdminClient();
    const feedbackTreatment =
      session.feedback_experiment_variant === "treatment";
    const feedbackVariant = feedbackTreatment
      ? (parsed.data.feedbackVariant ?? "standard")
      : "standard";
    const feedbackDwellSeconds = feedbackTreatment
      ? (parsed.data.feedbackDwellSeconds ?? null)
      : null;

    const { data: existing } = await admin
      .from("user_question_progress")
      .select(
        "id, times_answered, times_correct, state, stability, difficulty_rating, elapsed_days, scheduled_days, learning_steps, reps, lapses, next_review, last_answered_at",
      )
      .eq("user_id", user.id)
      .eq("question_id", parsed.data.questionId)
      .maybeSingle();

    const isFirstExposure = prevAns
      ? Boolean(prevAns.is_first_exposure)
      : !existing || (existing.times_answered ?? 0) === 0;

    const insertRow = {
      session_id: parsed.data.sessionId,
      question_id: parsed.data.questionId,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
      confidence: effectiveConfidence,
      time_spent_seconds: parsed.data.timeSpentSeconds ?? 0,
      question_order: parsed.data.questionOrder,
      answered_at: answeredAt.toISOString(),
      is_first_exposure: isFirstExposure,
      rating_source: attemptRating.source,
      fsrs_applied: false,
      scheduler_version:
        (session.scheduler_version as string | null) ??
        LEGACY_SCHEDULER_VERSION,
      fsrs_rating: attemptRating.grade,
      feedback_variant: feedbackVariant,
      feedback_dwell_seconds: feedbackDwellSeconds,
    };

    let insertedAnswer: { id: string } = { id: String(prevAns?.id ?? "") };
    if (!prevAns) {
      const { data, error: insErr } = await admin
        .from("session_answers")
        .insert(insertRow)
        .select("id")
        .single();
      if (insErr || !data) {
        // Równoległy retry wznowi przetwarzanie istniejącego wpisu.
        if (insErr?.code === "23505") {
          const { data: canonicalAnswer } = await admin
            .from("session_answers")
            .select("id")
            .eq("session_id", parsed.data.sessionId)
            .eq("question_id", parsed.data.questionId)
            .maybeSingle();
          if (canonicalAnswer && retryDepth < 1) {
            return submitAnswer(raw, retryDepth + 1);
          }
        }
        console.error(
          "[submitAnswer] session_answers insert",
          insErr?.message ?? "Brak zapisanego wiersza",
        );
        return { ok: false, message: t("errors.saveAnswerFailed") };
      }
      insertedAnswer = { id: String(data.id) };
    }

    // Każda realna próba przypomnienia aktualizuje model. W trybie klasycznym
    // nie ma samooceny, więc poprawność mapujemy na Again/Good.
    const persistedReview =
      storedReview ??
      (await persistUserProgressFsrs(
        admin,
        insertedAnswer.id,
        user.id,
        parsed.data.questionId,
        existing as Record<string, unknown> | null,
        isCorrect,
        effectiveConfidence,
        answeredAt,
      ));

    let effectiveMemoryReview = persistedReview;
    let effectiveSchedulerVersion =
      (session.scheduler_version as string | null) ?? LEGACY_SCHEDULER_VERSION;
    let effectiveEngineVariant = String(session.engine_variant ?? "shadow");
    const memoryIsCorrect = storedReview
      ? Boolean(prevAns?.is_correct)
      : isCorrect;
    const memoryConfidence = storedReview
      ? ((prevAns?.confidence as z.infer<typeof schema>["confidence"]) ?? null)
      : effectiveConfidence;

    try {
      const parameterSetId =
        (session.memory_parameter_set_id as string | null) ?? null;
      const memoryConfig = await loadMemoryParameterSetById(
        admin,
        parameterSetId,
      );
      const memoryV2Review = await persistShadowMemoryV2(admin, {
        userId: user.id,
        questionId: parsed.data.questionId,
        answerId: insertedAnswer.id as string,
        controlBefore: storedReview
          ? snapshotToProgress(storedReview.before)
          : (existing as Record<string, unknown> | null),
        isCorrect: memoryIsCorrect,
        confidence: memoryConfidence,
        parameterSetId,
        settings: {
          requestRetention: Number(
            session.target_retention ?? memoryConfig.requestRetention,
          ),
          maximumInterval: Number(
            session.maximum_interval ?? memoryConfig.maximumInterval,
          ),
          weights: memoryConfig.weights,
        },
        now: answeredAt,
        modelRole:
          session.engine_variant === "treatment" ? "treatment" : "shadow",
        requireExistingCard: false,
      });
      if (session.engine_variant === "treatment") {
        effectiveMemoryReview = {
          ...persistedReview,
          before: memoryV2Review.before,
          after: memoryV2Review.after,
        };
        const { error: treatmentTelemetryError } = await admin
          .from("session_answers")
          .update({
            scheduler_version: MEMORY_SCHEDULER_VERSION,
            state_before: memoryV2Review.before.state,
            state_after: memoryV2Review.after.state,
            retrievability_before: memoryV2Review.before.retrievability,
            retrievability_after: memoryV2Review.after.retrievability,
            stability_before: memoryV2Review.before.stability,
            stability_after: memoryV2Review.after.stability,
            difficulty_before: memoryV2Review.before.difficulty,
            difficulty_after: memoryV2Review.after.difficulty,
            fsrs_snapshot_before: memoryV2Review.before,
            fsrs_snapshot_after: memoryV2Review.after,
            due_before: memoryV2Review.before.due,
            due_after: memoryV2Review.after.due,
          })
          .eq("id", insertedAnswer.id);
        if (treatmentTelemetryError) {
          throw treatmentTelemetryError;
        }
      }
    } catch (shadowError) {
      // Shadow nie może przerwać bieżącej sesji. Brakującą projekcję odtworzy
      // deterministyczny replay z session_answers.
      console.error("[submitAnswer] memory-v2 shadow", shadowError);
      if (session.engine_variant === "treatment") {
        effectiveMemoryReview = persistedReview;
        effectiveSchedulerVersion = LEGACY_SCHEDULER_VERSION;
        effectiveEngineVariant = "shadow";
        const [answerFallback, sessionFallback] = await Promise.all([
          admin
            .from("session_answers")
            .update({
              scheduler_version: LEGACY_SCHEDULER_VERSION,
              memory_fallback: true,
            })
            .eq("id", insertedAnswer.id),
          admin
            .from("study_sessions")
            .update({
              engine_variant: "shadow",
              scheduler_version: LEGACY_SCHEDULER_VERSION,
              memory_fallback: true,
            })
            .eq("id", session.id),
        ]);
        if (answerFallback.error || sessionFallback.error) {
          console.error(
            "[submitAnswer] memory fallback telemetry",
            answerFallback.error?.message ?? sessionFallback.error?.message,
          );
        }
      }
    }

    const timeSeconds = prevAns
      ? Number(prevAns.time_spent_seconds ?? 0)
      : parsed.data.timeSpentSeconds;
    const answerPayload: Record<string, unknown> = {
      question_id: parsed.data.questionId,
      is_correct: isCorrect,
      confidence: effectiveConfidence,
      rating_source: effectiveMemoryReview.ratingSource,
      fsrs_rating: effectiveMemoryReview.rating,
      fsrs_rating_label: ratingToLabel(effectiveMemoryReview.rating),
      scheduler_version: effectiveSchedulerVersion,
      retrievability_before: effectiveMemoryReview.before.retrievability,
      retrievability_after: effectiveMemoryReview.after.retrievability,
      session_id: parsed.data.sessionId,
      subject_id: session.subject_id,
      topic_id: questionRow.topic_id,
      session_kind: sessionKind,
      is_first_exposure: isFirstExposure,
      feedback_variant: prevAns
        ? (prevAns.feedback_variant ?? null)
        : feedbackVariant,
      feedback_dwell_seconds: prevAns
        ? (prevAns.feedback_dwell_seconds ?? null)
        : feedbackDwellSeconds,
      engine_variant: effectiveEngineVariant,
      experiment_key: session.experiment_key,
      experiment_bucket: session.experiment_bucket,
      experiment_rollout_percent: session.experiment_rollout_percent,
      feedback_experiment_variant: session.feedback_experiment_variant,
    };
    if (timeSeconds != null) {
      answerPayload.time_seconds = timeSeconds;
    }
    const { error: finalizeError } = await admin.rpc(
      "finalize_learning_answer",
      {
        p_user_id: user.id,
        p_answer_id: insertedAnswer.id,
        p_question_id: parsed.data.questionId,
        p_retrievability: effectiveMemoryReview.after.retrievability,
        p_scheduler_version: effectiveSchedulerVersion,
        p_event_payload: answerPayload,
      },
    );
    if (finalizeError) {
      console.error("[submitAnswer] finalize learning", finalizeError.message);
      return { ok: false, message: t("errors.saveAnswerFailed") };
    }

    const { data: agg, error: aggregateError } = await supabase
      .from("session_answers")
      .select("is_correct, time_spent_seconds")
      .eq("session_id", parsed.data.sessionId);
    if (aggregateError) {
      console.error("[submitAnswer] aggregate", aggregateError.message);
      return { ok: false, message: t("errors.updateSessionFailed") };
    }

    const correct = (agg ?? []).filter((a) => a.is_correct).length;
    const duration = (agg ?? []).reduce(
      (s, a) => s + (a.time_spent_seconds ?? 0),
      0,
    );

    const { error: sessErr } = await admin
      .from("study_sessions")
      .update({
        correct_answers: correct,
        duration_seconds: duration,
      })
      .eq("id", session.id);

    if (sessErr) {
      console.error("[submitAnswer] study_sessions", sessErr.message);
      return { ok: false, message: t("errors.updateSessionFailed") };
    }

    return { ok: true };
  } catch (e) {
    console.error("[submitAnswer]", e);
    return { ok: false, message: t("errors.unexpected") };
  }
}
