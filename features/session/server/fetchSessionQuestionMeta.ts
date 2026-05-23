import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getRetrievability,
  type RetrievabilityInput,
} from "@/features/session/lib/antares/retrievability";
import {
  buildQuestionMeta,
  defaultQuestionMeta,
} from "@/features/session/lib/antares/questionMeta";
import type { SessionQuestionMeta } from "@/features/session/types";

function toRetrieverState(s: string): RetrievabilityInput["state"] {
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

type ProgressRow = {
  question_id: string;
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
  avg_time_seconds: unknown;
};

function rowToRetrievabilityInput(row: ProgressRow): RetrievabilityInput {
  return {
    stability: Number(row.stability ?? 0),
    difficulty_rating: Number(row.difficulty_rating ?? 0.3),
    elapsed_days: Number(row.elapsed_days ?? 0),
    scheduled_days: Number(row.scheduled_days ?? 0),
    reps: Number(row.reps ?? 0),
    lapses: Number(row.lapses ?? 0),
    state: toRetrieverState(String(row.state ?? "new")),
    next_review: (row.next_review as string | null) ?? null,
    last_answered_at: (row.last_answered_at as string | null) ?? null,
  };
}

/**
 * Pobiera metadane ANTARES per pytanie dla zalogowanego usera (batch).
 */
export async function fetchSessionQuestionMeta(
  supabase: SupabaseClient,
  userId: string,
  questionIds: string[],
): Promise<Map<string, SessionQuestionMeta>> {
  const out = new Map<string, SessionQuestionMeta>();
  if (questionIds.length === 0) return out;

  const uniqueIds = [...new Set(questionIds)];
  const now = new Date();

  const { data: qRows } = await supabase
    .from("questions")
    .select("id, topic_id")
    .in("id", uniqueIds);

  const topicByQ = new Map<string, string>();
  const topicIds = new Set<string>();
  for (const r of qRows ?? []) {
    const tid = r.topic_id as string;
    topicByQ.set(r.id as string, tid);
    topicIds.add(tid);
  }

  const topicMastery = new Map<string, number>();
  if (topicIds.size > 0) {
    const { data: cacheRows } = await supabase
      .from("topic_mastery_cache")
      .select("topic_id, mastery_score")
      .eq("user_id", userId)
      .in("topic_id", [...topicIds]);
    for (const r of cacheRows ?? []) {
      topicMastery.set(r.topic_id as string, Number(r.mastery_score ?? 0));
    }
  }

  const { data: progressRows } = await supabase
    .from("user_question_progress")
    .select(
      "question_id, stability, difficulty_rating, elapsed_days, scheduled_days, reps, lapses, state, next_review, last_answered_at, times_answered, times_correct, is_leech, avg_time_seconds",
    )
    .eq("user_id", userId)
    .in("question_id", uniqueIds);

  const progressByQ = new Map<string, ProgressRow>();
  for (const r of progressRows ?? []) {
    progressByQ.set(r.question_id as string, r as ProgressRow);
  }

  for (const qid of uniqueIds) {
    const tid = topicByQ.get(qid);
    const tm = tid != null ? (topicMastery.get(tid) ?? 0) : 0;
    const row = progressByQ.get(qid);

    if (!row || String(row.state ?? "new") === "new") {
      out.set(qid, defaultQuestionMeta(tm));
      continue;
    }

    const rInput = rowToRetrievabilityInput(row);
    const rVal = getRetrievability(rInput, now);
    out.set(
      qid,
      buildQuestionMeta({
        retrievability: rVal,
        fsrsDifficulty: Number(row.difficulty_rating ?? 0.3),
        isLeech: Boolean(row.is_leech),
        isNew: false,
        timesAnswered: Number(row.times_answered ?? 0),
        timesCorrect: Number(row.times_correct ?? 0),
        avgTimeSeconds:
          row.avg_time_seconds != null
            ? Number(row.avg_time_seconds)
            : null,
        topicMastery: tm,
      }),
    );
  }

  return out;
}
