import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getRetrievability,
  type RetrievabilityInput,
} from "./retrievability";

type ProgressRow = {
  stability: unknown;
  difficulty_rating: unknown;
  elapsed_days: unknown;
  scheduled_days: unknown;
  reps: unknown;
  lapses: unknown;
  state: unknown;
  next_review: unknown;
  last_answered_at: unknown;
  times_answered: unknown;
  times_correct: unknown;
  is_leech: unknown;
};

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

function rowToRetrievabilityInput(row: ProgressRow): RetrievabilityInput {
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

type MasteryTrend = "improving" | "declining" | "stable";

/**
 * Przelicza wpisy `topic_mastery_cache` dla podanych tematów po zakończonej sesji:
 * pokrycie, trafność, średnia retrievability (FSRS), wynik opanowania, trend z 7 dni,
 * liczba leechy oraz na końcu ranking słabych obszarów (`weakness_rank`).
 *
 * Błędy są logowane do konsoli i nie przerywają działania wywołującego kodu.
 */
export async function recalculateTopicMastery(
  supabase: SupabaseClient,
  userId: string,
  affectedTopicIds: string[],
): Promise<void> {
  try {
    const uniqueTopics = [...new Set(affectedTopicIds)];
    if (uniqueTopics.length === 0) {
      return;
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenIso = sevenDaysAgo.toISOString();

    const { data: userSessions, error: sessErr } = await supabase
      .from("study_sessions")
      .select("id")
      .eq("user_id", userId);

    if (sessErr) {
      throw sessErr;
    }

    const sessionIds = (userSessions ?? []).map((s) => s.id);

    for (const topicId of uniqueTopics) {
      const { data: topicQuestions, error: qErr } = await supabase
        .from("questions")
        .select("id")
        .eq("topic_id", topicId)
        .eq("is_active", true);

      if (qErr) {
        throw qErr;
      }

      const questionIds = (topicQuestions ?? []).map((q) => q.id);
      const totalQuestions = questionIds.length;

      let progressRows: ProgressRow[] = [];
      if (questionIds.length > 0) {
        const { data: pr, error: prErr } = await supabase
          .from("user_question_progress")
          .select(
            "stability, difficulty_rating, elapsed_days, scheduled_days, reps, lapses, state, next_review, last_answered_at, times_answered, times_correct, is_leech",
          )
          .eq("user_id", userId)
          .in("question_id", questionIds);

        if (prErr) {
          throw prErr;
        }
        progressRows = (pr ?? []) as ProgressRow[];
      }

      const seen = progressRows.length;
      const coverage =
        totalQuestions > 0 ? Math.min(1, seen / totalQuestions) : 0;

      let totalAnswered = 0;
      let totalCorrect = 0;
      for (const r of progressRows) {
        totalAnswered += Number(r.times_answered ?? 0);
        totalCorrect += Number(r.times_correct ?? 0);
      }

      const accuracy =
        totalAnswered > 0 ? totalCorrect / totalAnswered : 0;

      let sumR = 0;
      for (const r of progressRows) {
        sumR += getRetrievability(rowToRetrievabilityInput(r));
      }
      const avgRetrievability = seen > 0 ? sumR / seen : 0;

      const masteryScore =
        coverage * 0.3 + accuracy * 0.3 + avgRetrievability * 0.4;

      const leechCount = progressRows.filter((r) => Boolean(r.is_leech))
        .length;

      let total7 = 0;
      let correct7 = 0;
      if (sessionIds.length > 0 && questionIds.length > 0) {
        const { data: recent, error: ansErr } = await supabase
          .from("session_answers")
          .select("is_correct")
          .in("session_id", sessionIds)
          .in("question_id", questionIds)
          .gte("answered_at", sevenIso);

        if (ansErr) {
          throw ansErr;
        }
        for (const a of recent ?? []) {
          total7 += 1;
          if (a.is_correct) {
            correct7 += 1;
          }
        }
      }

      const accuracyLast7d = total7 > 0 ? correct7 / total7 : null;

      let trend: MasteryTrend = "stable";
      if (total7 > 0) {
        const acc7 = accuracyLast7d ?? 0;
        if (acc7 > accuracy + 0.05) {
          trend = "improving";
        } else if (acc7 < accuracy - 0.05) {
          trend = "declining";
        }
      }

      const { error: upsertErr } = await supabase
        .from("topic_mastery_cache")
        .upsert(
          {
            user_id: userId,
            topic_id: topicId,
            total_questions: totalQuestions,
            seen,
            coverage,
            total_answered: totalAnswered,
            total_correct: totalCorrect,
            accuracy,
            avg_retrievability: avgRetrievability,
            mastery_score: masteryScore,
            trend,
            accuracy_last_7d: accuracyLast7d,
            questions_last_7d: total7,
            leech_count: leechCount,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,topic_id" },
        );

      if (upsertErr) {
        throw upsertErr;
      }
    }

    const { data: allCached, error: listErr } = await supabase
      .from("topic_mastery_cache")
      .select("topic_id, mastery_score")
      .eq("user_id", userId)
      .order("mastery_score", { ascending: true });

    if (listErr) {
      throw listErr;
    }

    const ordered = allCached ?? [];

    for (let i = 0; i < ordered.length; i++) {
      const row = ordered[i];
      const { error: rankErr } = await supabase
        .from("topic_mastery_cache")
        .update({ weakness_rank: i + 1 })
        .eq("user_id", userId)
        .eq("topic_id", row.topic_id);

      if (rankErr) {
        throw rankErr;
      }
    }
  } catch (e) {
    console.error("[recalculateTopicMastery]", e);
  }
}
