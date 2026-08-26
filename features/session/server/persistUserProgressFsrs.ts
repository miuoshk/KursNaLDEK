import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculateObservedNextReview,
  type ProgressCardInput,
} from "@/features/session/lib/spaced-repetition";
import type {
  MemoryCardSnapshot,
  RatingSource,
} from "@/features/session/lib/memory/scheduler";
import type { Confidence } from "@/features/session/types";

export type PersistedFsrsReview = {
  applied: true;
  rating: number;
  ratingSource: RatingSource;
  before: MemoryCardSnapshot;
  after: MemoryCardSnapshot;
};

function toProgressInput(row: Record<string, unknown>): ProgressCardInput {
  return {
    stability: Number(row.stability ?? 0),
    difficulty_rating: Number(row.difficulty_rating ?? 0.3),
    elapsed_days: Number(row.elapsed_days ?? 0),
    scheduled_days: Number(row.scheduled_days ?? 0),
    learning_steps: Number(row.learning_steps ?? 0),
    reps: Number(row.reps ?? 0),
    lapses: Number(row.lapses ?? 0),
    state: String(row.state ?? "new"),
    next_review: row.next_review as string | null,
    last_answered_at: row.last_answered_at as string | null,
  };
}

function reviewFromStoredAnswer(
  row: Record<string, unknown> | null,
): PersistedFsrsReview | null {
  if (!row) return null;
  const rating = Number(row.fsrs_rating);
  if (![1, 2, 3, 4].includes(rating)) return null;
  const before = row.fsrs_snapshot_before;
  const after = row.fsrs_snapshot_after;
  if (
    !before ||
    !after ||
    typeof before !== "object" ||
    typeof after !== "object" ||
    Array.isArray(before) ||
    Array.isArray(after)
  ) {
    return null;
  }
  return {
    applied: true,
    rating,
    ratingSource: row.rating_source === "explicit" ? "explicit" : "observed",
    before: before as MemoryCardSnapshot,
    after: after as MemoryCardSnapshot,
  };
}

async function loadAppliedReview(
  supabase: SupabaseClient,
  answerId: string,
): Promise<PersistedFsrsReview | null> {
  const { data, error } = await supabase
    .from("session_answers")
    .select(
      "fsrs_rating, rating_source, fsrs_snapshot_before, fsrs_snapshot_after",
    )
    .eq("id", answerId)
    .maybeSingle();
  if (error) throw error;
  return reviewFromStoredAnswer(data as Record<string, unknown> | null);
}

/**
 * Persists per-question progress (`user_question_progress`) after a single
 * answer.
 *
 * Always bumps `times_answered` / `times_correct` / `last_answered_at` —
 * the dashboard mastery percentages and `topic_mastery_cache` depend on
 * those counters and ignoring them in any mode would make answered
 * questions disappear from the user's stats.
 *
 * Każda rzeczywista próba przypomnienia aktualizuje model. Gdy użytkownik nie
 * wystawia samooceny (np. Nauka klasyczna), poprawność jest mapowana
 * konserwatywnie: błąd = Again, poprawna odpowiedź = Good.
 */
export async function persistUserProgressFsrs(
  supabase: SupabaseClient,
  answerId: string,
  userId: string,
  questionId: string,
  existing: Record<string, unknown> | null,
  isCorrect: boolean,
  confidence: Confidence | null,
  now = new Date(),
): Promise<PersistedFsrsReview> {
  let current = existing;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (attempt > 0) {
      const { data, error } = await supabase
        .from("user_question_progress")
        .select(
          "id, times_answered, times_correct, state, stability, difficulty_rating, elapsed_days, scheduled_days, learning_steps, reps, lapses, next_review, last_answered_at",
        )
        .eq("user_id", userId)
        .eq("question_id", questionId)
        .maybeSingle();
      if (error) throw error;
      current = data as Record<string, unknown> | null;
    }

    const previousTimestamp = current?.last_answered_at
      ? new Date(String(current.last_answered_at)).getTime()
      : Number.NEGATIVE_INFINITY;
    const schedulingNow =
      Number.isFinite(previousTimestamp) && previousTimestamp >= now.getTime()
        ? new Date(previousTimestamp + 1)
        : now;
    const { rating, scheduled } = calculateObservedNextReview(
      current ? toProgressInput(current) : null,
      isCorrect,
      confidence,
      schedulingNow,
    );
    const progress = scheduled.progress;
    const { data: status, error } = await supabase.rpc(
      "apply_user_question_review",
      {
        p_answer_id: answerId,
        p_user_id: userId,
        p_question_id: questionId,
        p_expected_exists: current != null,
        p_expected_last_answered_at:
          (current?.last_answered_at as string | null) ?? null,
        p_expected_reps: Number(current?.reps ?? 0),
        p_is_correct: isCorrect,
        p_confidence: confidence,
        p_progress: {
          ...progress,
          last_answered_at: schedulingNow.toISOString(),
        },
        p_telemetry: {
          fsrs_rating: rating.grade,
          rating_source: rating.source,
          state_before: scheduled.before.state,
          state_after: scheduled.after.state,
          retrievability_before: scheduled.before.retrievability,
          retrievability_after: scheduled.after.retrievability,
          stability_before: scheduled.before.stability,
          stability_after: scheduled.after.stability,
          difficulty_before: scheduled.before.difficulty,
          difficulty_after: scheduled.after.difficulty,
          snapshot_before: scheduled.before,
          snapshot_after: scheduled.after,
          due_before: scheduled.before.due,
          due_after: scheduled.after.due,
        },
      },
    );
    if (error) throw error;
    if (status === "conflict") continue;
    if (status === "applied") {
      return {
        applied: true,
        rating: rating.grade,
        ratingSource: rating.source,
        before: scheduled.before,
        after: scheduled.after,
      };
    }
    if (status === "already_applied") {
      const existingReview = await loadAppliedReview(supabase, answerId);
      if (existingReview) return existingReview;
    }
    throw new Error(`Nieoczekiwany status zapisu FSRS: ${String(status)}`);
  }

  throw new Error(
    "Nie udało się zapisać próby FSRS po konflikcie równoległym.",
  );
}
