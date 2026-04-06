"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { computeSessionXp } from "@/features/session/server/computeSessionXp";
import { buildSessionSummary } from "@/features/session/server/sessionSummaryBuilder";
import { nextStreakValues, todayDateString } from "@/features/session/server/sessionStreak";
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
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowe dane." };
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
      .select(
        "id, user_id, subject_id, total_questions, correct_answers, duration_seconds, is_completed",
      )
      .eq("id", parsed.data.sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (se || !session) {
      return { ok: false, message: "Sesja nie została znaleziona." };
    }

    if (session.is_completed) {
      const summary = await buildSessionSummary(
        supabase,
        parsed.data.sessionId,
        user.id,
      );
      if (!summary) {
        return { ok: false, message: "Nie udało się wczytać podsumowania." };
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
          .select("question_id, is_correct, question_order, time_spent_seconds")
          .eq("session_id", parsed.data.sessionId),
        supabase
          .from("profiles")
          .select("xp, current_streak, longest_streak, last_active_date")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

    if (!profile) {
      return { ok: false, message: "Brak profilu użytkownika." };
    }

    const isFirstSessionEver = (completedBefore ?? 0) === 0;

    const ansRows = [...(ansRowsRaw ?? [])].sort(
      (a, b) => (a.question_order ?? 0) - (b.question_order ?? 0),
    );

    const qids = [...new Set(ansRows.map((a) => a.question_id as string))];

    let diffRows: { id: string; difficulty: string }[] = [];
    if (qids.length > 0) {
      const { data } = await supabase
        .from("questions")
        .select("id, difficulty")
        .in("id", qids);
      diffRows = (data ?? []) as { id: string; difficulty: string }[];
    }

    const diffById = new Map(diffRows.map((d) => [d.id, d.difficulty]));

    const forXp = ansRows.map((a) => ({
      is_correct: a.is_correct as boolean,
      difficulty: diffById.get(a.question_id as string) ?? "srednie",
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
      supabase
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
      return { ok: false, message: "Nie udało się zamknąć sesji." };
    }
    if (upProfRes.error) {
      console.error("[completeSession] profiles", upProfRes.error.message);
      return { ok: false, message: "Nie udało się zaktualizować profilu." };
    }

    const [summary, profAfter] = await Promise.all([
      buildSessionSummary(supabase, parsed.data.sessionId, user.id),
      supabase.from("profiles").select("xp, current_streak").eq("id", user.id).single(),
    ]);

    if (!summary) {
      return { ok: false, message: "Nie udało się zbudować podsumowania." };
    }

    summary.xpEarned = xpEarned;
    summary.achievementUnlocked = isFirstSessionEver ? "Pierwsza sesja" : null;
    summary.previousStreakDays = profile.current_streak ?? 0;

    if (profAfter.data) {
      summary.newXpTotal = profAfter.data.xp ?? summary.newXpTotal;
      summary.newStreak = profAfter.data.current_streak ?? summary.newStreak;
    }

    return { ok: true, summary };
  } catch (e) {
    console.error("[completeSession]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
