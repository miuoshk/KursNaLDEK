"use server";

import { z } from "zod";
import { Rating, type Grade } from "ts-fsrs";
import { createClient } from "@/lib/supabase/server";
import { persistUserProgressFsrs } from "@/features/session/server/persistUserProgressFsrs";
import { updateLeechStatus } from "@/features/session/lib/antares/leechDetector";
import {
  getRetrievability,
  type RetrievabilityInput,
} from "@/features/session/lib/antares/retrievability";
import { confidenceToRating } from "@/features/session/lib/spaced-repetition";
import type { Confidence } from "@/features/session/types";

const schema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  isCorrect: z.boolean(),
  confidence: z.enum(["nie_wiedzialem", "troche", "na_pewno"]).nullable(),
  timeSpentSeconds: z.number().int().min(0).optional(),
  questionOrder: z.number().int().min(0),
  skipFsrs: z.boolean().optional(),
});

export type SubmitAnswerResult = { ok: true } | { ok: false; message: string };

function gradeToLastRatingLabel(grade: Grade): string {
  switch (grade) {
    case Rating.Again:
      return "Again";
    case Rating.Hard:
      return "Hard";
    case Rating.Good:
      return "Good";
    case Rating.Easy:
      return "Easy";
    default:
      return "Good";
  }
}

function toRetrievabilityState(s: string): RetrievabilityInput["state"] {
  if (
    s === "new" ||
    s === "learning" ||
    s === "review" ||
    s === "relearning"
  ) {
    return s;
  }
  return "new";
}

function rowToRetrievabilityInput(row: {
  stability: unknown;
  difficulty_rating: unknown;
  elapsed_days: unknown;
  scheduled_days: unknown;
  reps: unknown;
  lapses: unknown;
  state: unknown;
  next_review: unknown;
  last_answered_at: unknown;
}): RetrievabilityInput {
  return {
    stability: Number(row.stability ?? 0),
    difficulty_rating: Number(row.difficulty_rating ?? 0.3),
    elapsed_days: Number(row.elapsed_days ?? 0),
    scheduled_days: Number(row.scheduled_days ?? 0),
    reps: Number(row.reps ?? 0),
    lapses: Number(row.lapses ?? 0),
    state: toRetrievabilityState(String(row.state ?? "new")),
    next_review: (row.next_review as string | null) ?? null,
    last_answered_at: (row.last_answered_at as string | null) ?? null,
  };
}

export async function submitAnswer(
  raw: z.infer<typeof schema>,
): Promise<SubmitAnswerResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowe dane odpowiedzi." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Brak sesji logowania." };
    }

    const { data: session, error: se } = await supabase
      .from("study_sessions")
      .select("id, user_id")
      .eq("id", parsed.data.sessionId)
      .maybeSingle();

    if (se || !session || session.user_id !== user.id) {
      return { ok: false, message: "Sesja nie została znaleziona." };
    }

    const { data: prevAns } = await supabase
      .from("session_answers")
      .select("id")
      .eq("session_id", parsed.data.sessionId)
      .eq("question_id", parsed.data.questionId)
      .maybeSingle();

    const { data: existing } = await supabase
      .from("user_question_progress")
      .select(
        "id, times_answered, times_correct, state, stability, difficulty_rating, elapsed_days, scheduled_days, reps, lapses, next_review, last_answered_at",
      )
      .eq("user_id", user.id)
      .eq("question_id", parsed.data.questionId)
      .maybeSingle();

    const isFirstExposure =
      !existing || (existing.times_answered ?? 0) === 0;

    const insertRow = {
      session_id: parsed.data.sessionId,
      question_id: parsed.data.questionId,
      selected_option_id: parsed.data.selectedOptionId,
      is_correct: parsed.data.isCorrect,
      confidence: parsed.data.confidence,
      time_spent_seconds: parsed.data.timeSpentSeconds ?? 0,
      question_order: parsed.data.questionOrder,
      answered_at: new Date().toISOString(),
      is_first_exposure: isFirstExposure,
    };

    if (prevAns) {
      const { error: upErr } = await supabase
        .from("session_answers")
        .update({
          selected_option_id: insertRow.selected_option_id,
          is_correct: insertRow.is_correct,
          confidence: insertRow.confidence,
          time_spent_seconds: insertRow.time_spent_seconds,
          question_order: insertRow.question_order,
          answered_at: insertRow.answered_at,
        })
        .eq("id", prevAns.id);
      if (upErr) {
        console.error("[submitAnswer] session_answers update", upErr.message);
        return { ok: false, message: "Nie udało się zapisać odpowiedzi." };
      }
    } else {
      const { error: insErr } = await supabase
        .from("session_answers")
        .insert(insertRow);
      if (insErr) {
        console.error("[submitAnswer] session_answers insert", insErr.message);
        return { ok: false, message: "Nie udało się zapisać odpowiedzi." };
      }
    }

    if (!parsed.data.skipFsrs) {
      await persistUserProgressFsrs(
        supabase,
        user.id,
        parsed.data.questionId,
        existing as Record<string, unknown> | null,
        parsed.data.isCorrect,
        parsed.data.confidence,
        !!prevAns,
      );
    }

    if (!prevAns) {
      try {
        const { data: progressRow, error: progressFetchErr } = await supabase
          .from("user_question_progress")
          .select(
            "id, stability, difficulty_rating, elapsed_days, scheduled_days, reps, lapses, state, next_review, last_answered_at, correct_streak, wrong_streak, is_leech, leech_count, avg_time_seconds",
          )
          .eq("user_id", user.id)
          .eq("question_id", parsed.data.questionId)
          .maybeSingle();

        if (progressFetchErr) {
          throw progressFetchErr;
        }
        if (!progressRow) {
          throw new Error("Brak wiersza postępu dla ANTARES.");
        }

        const oldCorrect = Number(progressRow.correct_streak ?? 0);
        const oldWrong = Number(progressRow.wrong_streak ?? 0);
        const newCorrectStreak = parsed.data.isCorrect ? oldCorrect + 1 : 0;
        const newWrongStreak = parsed.data.isCorrect ? 0 : oldWrong + 1;

        const wasLeech = Boolean(progressRow.is_leech);
        const currentLeechCount = Number(progressRow.leech_count ?? 0);

        const { isLeech, leechCount: nextLeechCount } = updateLeechStatus(
          newWrongStreak,
          newCorrectStreak,
          wasLeech,
          currentLeechCount,
        );

        const timeSeconds = parsed.data.timeSpentSeconds;
        const oldAvg =
          progressRow.avg_time_seconds != null
            ? Number(progressRow.avg_time_seconds)
            : null;
        const nextAvg =
          timeSeconds != null
            ? oldAvg != null && Number.isFinite(oldAvg)
              ? oldAvg * 0.7 + timeSeconds * 0.3
              : timeSeconds
            : null;

        const fsConf = (parsed.data.confidence ?? "troche") as Confidence;
        const grade = confidenceToRating(parsed.data.isCorrect, fsConf);
        const lastRating = gradeToLastRatingLabel(grade);

        const progressAntaresUpdate: Record<string, unknown> = {
          correct_streak: newCorrectStreak,
          wrong_streak: newWrongStreak,
          is_leech: isLeech,
          leech_count: nextLeechCount,
          last_rating: lastRating,
        };
        if (nextAvg != null) {
          progressAntaresUpdate.avg_time_seconds = nextAvg;
        }

        const { error: antaresUqpErr } = await supabase
          .from("user_question_progress")
          .update(progressAntaresUpdate)
          .eq("id", progressRow.id);

        if (antaresUqpErr) {
          throw antaresUqpErr;
        }

        const retrievability = getRetrievability(
          rowToRetrievabilityInput(progressRow),
        );

        const answerPayload: Record<string, unknown> = {
          question_id: parsed.data.questionId,
          is_correct: parsed.data.isCorrect,
          confidence: parsed.data.confidence,
          retrievability,
        };
        if (timeSeconds != null) {
          answerPayload.time_seconds = timeSeconds;
        }

        const { error: answerEventErr } = await supabase
          .from("learning_events")
          .insert({
            user_id: user.id,
            event_type: "answer",
            payload: answerPayload,
          });

        if (answerEventErr) {
          throw answerEventErr;
        }

        if (!wasLeech && isLeech) {
          const { error: leechEventErr } = await supabase
            .from("learning_events")
            .insert({
              user_id: user.id,
              event_type: "leech_hit",
              payload: {
                question_id: parsed.data.questionId,
                wrong_streak: newWrongStreak,
              },
            });

          if (leechEventErr) {
            throw leechEventErr;
          }
        }
      } catch (antaresErr) {
        console.error("[submitAnswer] ANTARES", antaresErr);
      }
    }

    const { data: agg } = await supabase
      .from("session_answers")
      .select("is_correct, time_spent_seconds")
      .eq("session_id", parsed.data.sessionId);

    const correct = (agg ?? []).filter((a) => a.is_correct).length;
    const duration = (agg ?? []).reduce(
      (s, a) => s + (a.time_spent_seconds ?? 0),
      0,
    );

    const { error: sessErr } = await supabase
      .from("study_sessions")
      .update({
        correct_answers: correct,
        duration_seconds: duration,
      })
      .eq("id", session.id);

    if (sessErr) {
      console.error("[submitAnswer] study_sessions", sessErr.message);
      return { ok: false, message: "Nie udało się zaktualizować sesji." };
    }

    return { ok: true };
  } catch (e) {
    console.error("[submitAnswer]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
