import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  classifyAttemptRating,
  MEMORY_SCHEDULER_VERSION,
  scheduleMemoryReview,
  type MemorySchedulerSettings,
  type MemoryCardSnapshot,
  type ProgressCardInput,
  type ScheduledMemoryReview,
} from "@/features/session/lib/memory/scheduler";
import type { Confidence } from "@/features/session/types";

type ShadowMemoryInput = {
  userId: string;
  questionId: string;
  answerId: string;
  controlBefore: Record<string, unknown> | null;
  isCorrect: boolean;
  confidence: Confidence | null;
  parameterSetId: string | null;
  settings: MemorySchedulerSettings;
  now: Date;
  modelRole: "shadow" | "treatment";
  requireExistingCard?: boolean;
};

function toProgress(row: Record<string, unknown>): ProgressCardInput {
  return {
    stability: Number(row.stability ?? 0),
    difficulty_rating: Number(row.difficulty ?? row.difficulty_rating ?? 0.3),
    elapsed_days: Number(row.elapsed_days ?? 0),
    scheduled_days: Number(row.scheduled_days ?? 0),
    learning_steps: Number(row.learning_steps ?? 0),
    reps: Number(row.reps ?? 0),
    lapses: Number(row.lapses ?? 0),
    state: String(row.state ?? "new"),
    next_review: (row.next_review as string | null) ?? null,
    last_answered_at: (row.last_answered_at as string | null) ?? null,
  };
}

function reviewFromProjection(
  row: Record<string, unknown> | null,
): ScheduledMemoryReview | null {
  if (!row) return null;
  const before = row.snapshot_before as MemoryCardSnapshot | null;
  const after = row.snapshot_after as MemoryCardSnapshot | null;
  if (!before || !after) return null;
  return {
    rating: Number(row.fsrs_rating) as ScheduledMemoryReview["rating"],
    before,
    after,
    progress: {
      stability: after.stability,
      difficulty_rating: after.difficulty,
      elapsed_days: after.elapsedDays,
      scheduled_days: after.scheduledDays,
      learning_steps: after.learningSteps,
      reps: after.reps,
      lapses: after.lapses,
      state: after.state,
      next_review: after.due,
      last_answered_at: after.lastReview,
    },
  };
}

async function loadAppliedProjection(
  supabase: SupabaseClient,
  answerId: string,
): Promise<ScheduledMemoryReview | null> {
  const { data, error } = await supabase
    .from("session_answer_memory_projections")
    .select("fsrs_rating, snapshot_before, snapshot_after")
    .eq("answer_id", answerId)
    .eq("scheduler_version", MEMORY_SCHEDULER_VERSION)
    .maybeSingle();
  if (error) throw error;
  return reviewFromProjection(data as Record<string, unknown> | null);
}

/**
 * Dual-write do wersjonowanej projekcji v2. Brak stanu po replayu jest
 * inicjalizowany stanem v1 sprzed bieżącej próby i jawnie oznaczony `seed-v1`.
 */
export async function persistShadowMemoryV2(
  supabase: SupabaseClient,
  input: ShadowMemoryInput,
) {
  const applied = await loadAppliedProjection(supabase, input.answerId);
  if (applied) return applied;

  for (let retry = 0; retry < 5; retry += 1) {
    const { data: existingV2, error: readError } = await supabase
      .from("user_question_memory_v2")
      .select(
        "state, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, next_review, last_answered_at",
      )
      .eq("user_id", input.userId)
      .eq("question_id", input.questionId)
      .eq("scheduler_version", MEMORY_SCHEDULER_VERSION)
      .maybeSingle();
    if (readError) throw readError;
    if (!existingV2 && input.requireExistingCard) {
      throw new Error(
        "Brak odbudowanego stanu memory v2 dla istniejącej karty.",
      );
    }

    const seededFromV1 =
      !existingV2 &&
      input.controlBefore != null &&
      Number(input.controlBefore.reps ?? 0) > 0;
    const current = existingV2
      ? toProgress(existingV2 as Record<string, unknown>)
      : seededFromV1
        ? toProgress(input.controlBefore!)
        : null;
    const previousTimestamp = current?.last_answered_at
      ? new Date(current.last_answered_at).getTime()
      : Number.NEGATIVE_INFINITY;
    const schedulingNow =
      Number.isFinite(previousTimestamp) &&
      previousTimestamp >= input.now.getTime()
        ? new Date(previousTimestamp + 1)
        : input.now;
    const attempt = classifyAttemptRating(input.isCorrect, input.confidence);
    const scheduled = scheduleMemoryReview(
      current,
      attempt.grade,
      schedulingNow,
      input.settings,
    );
    const progress = {
      state: scheduled.progress.state,
      stability: scheduled.progress.stability,
      difficulty: scheduled.progress.difficulty_rating,
      elapsed_days: scheduled.progress.elapsed_days,
      scheduled_days: scheduled.progress.scheduled_days,
      learning_steps: scheduled.progress.learning_steps,
      reps: scheduled.progress.reps,
      lapses: scheduled.progress.lapses,
      next_review: scheduled.progress.next_review,
      last_answered_at: schedulingNow.toISOString(),
      source: seededFromV1 ? "seed-v1" : "live",
      updated_at: schedulingNow.toISOString(),
    };
    const projection = {
      fsrs_rating: attempt.grade,
      state_before: scheduled.before.state,
      state_after: scheduled.after.state,
      retrievability_before: scheduled.before.retrievability,
      retrievability_after: scheduled.after.retrievability,
      stability_before: scheduled.before.stability,
      stability_after: scheduled.after.stability,
      difficulty_before: scheduled.before.difficulty,
      difficulty_after: scheduled.after.difficulty,
      learning_steps_before: scheduled.before.learningSteps,
      learning_steps_after: scheduled.after.learningSteps,
      snapshot_before: scheduled.before,
      snapshot_after: scheduled.after,
      due_before: scheduled.before.due,
      due_after: scheduled.after.due,
    };
    const { data: status, error } = await supabase.rpc(
      "apply_memory_v2_review",
      {
        p_answer_id: input.answerId,
        p_user_id: input.userId,
        p_question_id: input.questionId,
        p_scheduler_version: MEMORY_SCHEDULER_VERSION,
        p_parameter_set_id: input.parameterSetId,
        p_model_role: input.modelRole,
        p_expected_exists: existingV2 != null,
        p_expected_last_answered_at:
          (existingV2?.last_answered_at as string | null) ?? null,
        p_expected_reps: Number(existingV2?.reps ?? 0),
        p_progress: progress,
        p_projection: projection,
      },
    );
    if (error) throw error;
    if (status === "conflict") continue;
    if (status === "applied") return scheduled;
    if (status === "already_applied") {
      const existingProjection = await loadAppliedProjection(
        supabase,
        input.answerId,
      );
      if (existingProjection) return existingProjection;
    }
    throw new Error(`Nieoczekiwany status zapisu memory v2: ${String(status)}`);
  }

  throw new Error("Konflikt równoległego zapisu pamięci v2.");
}
