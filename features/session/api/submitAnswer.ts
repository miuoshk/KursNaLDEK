"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { persistUserProgressFsrs } from "@/features/session/server/persistUserProgressFsrs";

const schema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  isCorrect: z.boolean(),
  confidence: z.enum(["nie_wiedzialem", "troche", "na_pewno"]).nullable(),
  timeSpentSeconds: z.number().int().min(0),
  questionOrder: z.number().int().min(0),
});

export type SubmitAnswerResult = { ok: true } | { ok: false; message: string };

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
      time_spent_seconds: parsed.data.timeSpentSeconds,
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

    await persistUserProgressFsrs(
      supabase,
      user.id,
      parsed.data.questionId,
      existing as Record<string, unknown> | null,
      parsed.data.isCorrect,
      parsed.data.confidence,
      !!prevAns,
    );

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
