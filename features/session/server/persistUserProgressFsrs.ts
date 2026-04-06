import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculateNextReview,
  type ProgressCardInput,
} from "@/features/session/lib/spaced-repetition";
import type { Confidence } from "@/features/session/types";

function toProgressInput(row: Record<string, unknown>): ProgressCardInput {
  return {
    stability: Number(row.stability ?? 0),
    difficulty_rating: Number(row.difficulty_rating ?? 0.3),
    elapsed_days: Number(row.elapsed_days ?? 0),
    scheduled_days: Number(row.scheduled_days ?? 0),
    reps: Number(row.reps ?? 0),
    lapses: Number(row.lapses ?? 0),
    state: String(row.state ?? "new"),
    next_review: row.next_review as string | null,
    last_answered_at: row.last_answered_at as string | null,
  };
}

export async function persistUserProgressFsrs(
  supabase: SupabaseClient,
  userId: string,
  questionId: string,
  existing: Record<string, unknown> | null,
  isCorrect: boolean,
  confidence: Confidence | null,
  prevAns: boolean,
): Promise<void> {
  if (prevAns) return;

  const fsConf = (confidence ?? "troche") as Confidence;
  const fsrsOut = calculateNextReview(
    existing ? toProgressInput(existing) : null,
    isCorrect,
    fsConf,
  );

  if (existing) {
    await supabase
      .from("user_question_progress")
      .update({
        times_answered: (Number(existing.times_answered) || 0) + 1,
        times_correct:
          (Number(existing.times_correct) || 0) + (isCorrect ? 1 : 0),
        last_answered_at: new Date().toISOString(),
        last_confidence: confidence,
        stability: fsrsOut.stability,
        difficulty_rating: fsrsOut.difficulty_rating,
        elapsed_days: fsrsOut.elapsed_days,
        scheduled_days: fsrsOut.scheduled_days,
        reps: fsrsOut.reps,
        lapses: fsrsOut.lapses,
        state: fsrsOut.state,
        next_review: fsrsOut.next_review,
      })
      .eq("id", existing.id as string);
  } else {
    await supabase.from("user_question_progress").insert({
      user_id: userId,
      question_id: questionId,
      times_answered: 1,
      times_correct: isCorrect ? 1 : 0,
      last_answered_at: new Date().toISOString(),
      last_confidence: confidence,
      stability: fsrsOut.stability,
      difficulty_rating: fsrsOut.difficulty_rating,
      elapsed_days: fsrsOut.elapsed_days,
      scheduled_days: fsrsOut.scheduled_days,
      reps: fsrsOut.reps,
      lapses: fsrsOut.lapses,
      state: fsrsOut.state,
      next_review: fsrsOut.next_review,
    });
  }
}
