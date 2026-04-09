import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalibrationData } from "@/features/session/lib/antares/confidenceCalibration";
import {
  calculateExamReadiness,
  type TopicKnowledgeState,
} from "@/features/session/lib/antares/examReadiness";
import {
  getRetrievability,
  type RetrievabilityInput,
} from "@/features/session/lib/antares/retrievability";
import type { SessionAnswerData, SessionInsights } from "@/features/session/lib/antares/sessionInsights";
import { generateSessionInsights } from "@/features/session/lib/antares/sessionInsights";
import { recalculateTopicMastery } from "@/features/session/lib/antares/recalculateTopicMastery";
import type { SessionInsightsPayload } from "@/features/session/summaryTypes";

type AnswerRow = {
  question_id: string;
  is_correct: boolean;
  confidence: string | null;
  time_spent_seconds: number | null;
  question_order: number | null;
  answered_at: string | null;
};

type LearnPayload = {
  question_id?: string;
  retrievability?: number;
};

function rowToRInput(row: {
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
  const s = String(row.state ?? "new");
  const state: RetrievabilityInput["state"] =
    s === "new" || s === "learning" || s === "review" || s === "relearning"
      ? s
      : "new";
  return {
    stability: Number(row.stability ?? 0),
    difficulty_rating: Number(row.difficulty_rating ?? 0.3),
    elapsed_days: Number(row.elapsed_days ?? 0),
    scheduled_days: Number(row.scheduled_days ?? 0),
    reps: Number(row.reps ?? 0),
    lapses: Number(row.lapses ?? 0),
    state,
    next_review: (row.next_review as string | null) ?? null,
    last_answered_at: (row.last_answered_at as string | null) ?? null,
  };
}

function serializeInsights(ins: SessionInsights): SessionInsightsPayload {
  return {
    accuracy: ins.accuracy,
    avgTimeSeconds: ins.avgTimeSeconds,
    fastestQuestion: ins.fastestQuestion,
    slowestQuestion: ins.slowestQuestion,
    topicAccuracy: [...ins.topicAccuracy.entries()].map(([topicId, v]) => ({
      topicId,
      ...v,
    })),
    leechesHit: ins.leechesHit,
    retrievabilityGain: ins.retrievabilityGain,
    masteryDelta: [...ins.masteryDelta.entries()].map(([topicId, delta]) => ({
      topicId,
      delta,
    })),
    nextSessionFocus: ins.nextSessionFocus,
    fatigueWarning: ins.fatigueWarning,
    calibrationTip: ins.calibrationTip,
  };
}

async function fetchMasteryMap(
  supabase: SupabaseClient,
  userId: string,
  topicIds: string[],
): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  if (topicIds.length === 0) return m;
  const { data } = await supabase
    .from("topic_mastery_cache")
    .select("topic_id, mastery_score")
    .eq("user_id", userId)
    .in("topic_id", topicIds);
  for (const r of data ?? []) {
    m.set(r.topic_id as string, Number(r.mastery_score ?? 0));
  }
  return m;
}

function buildCalibration(ans: AnswerRow[]): CalibrationData {
  let na_pewno_correct = 0;
  let na_pewno_total = 0;
  let nie_wiedzialem_correct = 0;
  let nie_wiedzialem_total = 0;
  for (const a of ans) {
    const c = a.confidence;
    if (c === "na_pewno") {
      na_pewno_total += 1;
      if (a.is_correct) na_pewno_correct += 1;
    }
    if (c === "nie_wiedzialem") {
      nie_wiedzialem_total += 1;
      if (a.is_correct) nie_wiedzialem_correct += 1;
    }
  }
  return {
    na_pewno_correct,
    na_pewno_total,
    nie_wiedzialem_correct,
    nie_wiedzialem_total,
  };
}

export type PostAntaresResult = {
  sessionInsights: SessionInsightsPayload;
  examReadiness: {
    score: number;
    verdict: string;
    weakestTopics: string[];
    estimatedReadyDate: string | null;
    dailyRecommendation: number;
  };
};

/**
 * Po zamknięciu sesji: przelicza cache tematów, insighty, gotowość egzaminacyjną,
 * zapisuje JSON insightów i aktualizuje profil.
 */
export async function runCompleteSessionPostAntares(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  sessionStartedAt: string,
  affectedTopicIds: string[],
  ansRows: AnswerRow[],
  answeredCount: number,
): Promise<PostAntaresResult | null> {
  if (ansRows.length === 0) {
    return null;
  }

  const masteryBefore = await fetchMasteryMap(
    supabase,
    userId,
    affectedTopicIds,
  );

  await recalculateTopicMastery(supabase, userId, affectedTopicIds);

  const masteryAfter = await fetchMasteryMap(
    supabase,
    userId,
    affectedTopicIds,
  );

  const qids = [...new Set(ansRows.map((a) => a.question_id as string))];

  const [{ data: qRows }, { data: uqpRows }, { data: learnRows }, { data: leechEv }] =
    await Promise.all([
      supabase.from("questions").select("id, topic_id").in("id", qids),
      supabase
        .from("user_question_progress")
        .select(
          "question_id, stability, difficulty_rating, elapsed_days, scheduled_days, reps, lapses, state, next_review, last_answered_at",
        )
        .eq("user_id", userId)
        .in("question_id", qids),
      supabase
        .from("learning_events")
        .select("created_at, payload")
        .eq("user_id", userId)
        .eq("event_type", "answer")
        .order("created_at", { ascending: true })
        .limit(5000),
      supabase
        .from("learning_events")
        .select("payload, created_at")
        .eq("user_id", userId)
        .eq("event_type", "leech_hit")
        .gte("created_at", sessionStartedAt),
    ]);

  const topicByQ = new Map(
    (qRows ?? []).map((q) => [q.id as string, q.topic_id as string]),
  );

  const uqpByQ = new Map(
    (uqpRows ?? []).map((r) => [r.question_id as string, r]),
  );

  const allAnswerEvents = (learnRows ?? [])
    .map((e) => ({
      t: new Date(e.created_at as string).getTime(),
      p: e.payload as LearnPayload,
    }))
    .filter((e) => e.p?.question_id && qids.includes(e.p.question_id))
    .sort((a, b) => a.t - b.t);

  const sessionStart = new Date(sessionStartedAt).getTime();

  function findPrevR(qid: string, beforeT: number): number {
    let r = 0;
    for (const e of allAnswerEvents) {
      if (e.p.question_id !== qid) continue;
      if (e.t >= beforeT) break;
      r = e.p.retrievability ?? 0;
    }
    return r;
  }

  const newLeechQuestionIds: string[] = [];
  for (const e of leechEv ?? []) {
    const p = e.payload as { question_id?: string };
    if (p?.question_id && qids.includes(p.question_id)) {
      newLeechQuestionIds.push(p.question_id);
    }
  }

  const sortedAns = [...ansRows].sort(
    (a, b) =>
      (a.question_order ?? 0) - (b.question_order ?? 0) ||
      String(a.answered_at).localeCompare(String(b.answered_at)),
  );

  const sessionAnswerData: SessionAnswerData[] = [];

  for (const a of sortedAns) {
    const qid = a.question_id as string;
    const topicId = topicByQ.get(qid) ?? "";
    const timeSeconds = a.time_spent_seconds ?? 0;
    const conf = a.confidence ?? "";

    const answeredAt = a.answered_at
      ? new Date(a.answered_at).getTime()
      : Date.now();

    let best: { t: number; p: LearnPayload } | null = null;
    let bestDelta = Infinity;
    for (const e of allAnswerEvents) {
      if (e.p.question_id !== qid) continue;
      if (e.t < sessionStart - 120_000) continue;
      const d = Math.abs(e.t - answeredAt);
      if (d < bestDelta) {
        bestDelta = d;
        best = e;
      }
    }

    let rBefore = 0;
    let rAfter = 0;
    if (best) {
      rAfter = best.p.retrievability ?? 0;
      rBefore = findPrevR(qid, best.t);
    }

    const uqp = uqpByQ.get(qid);
    if (uqp) {
      const rNow = getRetrievability(rowToRInput(uqp));
      if (!best) {
        rBefore = rNow;
        rAfter = rNow;
      } else if (rAfter === 0) {
        rAfter = rNow;
      }
    }

    sessionAnswerData.push({
      questionId: qid,
      topicId,
      isCorrect: Boolean(a.is_correct),
      confidence: conf,
      timeSeconds,
      retrievabilityBefore: rBefore,
      retrievabilityAfter: rAfter,
    });
  }

  const topicIdsForNames = [
    ...new Set(sessionAnswerData.map((x) => x.topicId).filter(Boolean)),
  ];
  const topicNamesById = new Map<string, string>();
  if (topicIdsForNames.length > 0) {
    const { data: topicNameRows } = await supabase
      .from("topics")
      .select("id, name")
      .in("id", topicIdsForNames);
    for (const t of topicNameRows ?? []) {
      topicNamesById.set(t.id as string, t.name as string);
    }
  }

  const calibration = buildCalibration(ansRows);

  const insights = generateSessionInsights(
    sessionAnswerData,
    calibration,
    masteryBefore,
    masteryAfter,
    newLeechQuestionIds,
    topicNamesById,
  );

  const sessionInsights = serializeInsights(insights);

  const { data: allCache } = await supabase
    .from("topic_mastery_cache")
    .select(
      "topic_id, total_questions, seen, coverage, total_answered, total_correct, accuracy, avg_retrievability, mastery_score, weakness_rank, trend, accuracy_last_7d, leech_count",
    )
    .eq("user_id", userId);

  const cacheTopicIds = (allCache ?? []).map((r) => r.topic_id as string);
  let topicMeta: { id: string; name: string; subject_id: string }[] = [];
  if (cacheTopicIds.length > 0) {
    const { data } = await supabase
      .from("topics")
      .select("id, name, subject_id")
      .in("id", cacheTopicIds);
    topicMeta = (data ?? []) as { id: string; name: string; subject_id: string }[];
  }

  const metaByT = new Map(
    topicMeta.map((t) => [
      t.id as string,
      { name: t.name as string, subject_id: t.subject_id as string },
    ]),
  );

  const topicStates: TopicKnowledgeState[] = (allCache ?? []).map((r) => {
    const tid = r.topic_id as string;
    const meta = metaByT.get(tid);
    const trend = r.trend as string;
    const tr: TopicKnowledgeState["trend"] =
      trend === "improving" || trend === "declining" || trend === "stable"
        ? trend
        : "stable";
    return {
      topicId: tid,
      subjectId: meta?.subject_id ?? "",
      topicName: meta?.name ?? tid,
      totalQuestions: Number(r.total_questions ?? 0),
      seenQuestions: Number(r.seen ?? 0),
      coverageRatio: Number(r.coverage ?? 0),
      accuracy: Number(r.accuracy ?? 0),
      avgRetrievability: Number(r.avg_retrievability ?? 0),
      masteryScore: Number(r.mastery_score ?? 0),
      weaknessRank: Number(r.weakness_rank ?? 999),
      trend: tr,
      questionsLast7d: 0,
      accuracyLast7d:
        r.accuracy_last_7d != null ? Number(r.accuracy_last_7d) : null,
      leechCount: Number(r.leech_count ?? 0),
    };
  });

  const { data: prof } = await supabase
    .from("profiles")
    .select("exam_date, questions_answered_total")
    .eq("id", userId)
    .maybeSingle();

  const { data: completedSessions } = await supabase
    .from("study_sessions")
    .select("completed_at")
    .eq("user_id", userId)
    .not("completed_at", "is", null);

  const daysActive = new Set(
    (completedSessions ?? []).map((s) =>
      new Date(s.completed_at as string).toISOString().slice(0, 10),
    ),
  ).size;

  const examDateRaw = prof?.exam_date as string | null | undefined;
  const examDate = examDateRaw ? new Date(examDateRaw) : null;

  const prevAnswered = Number(prof?.questions_answered_total ?? 0);
  const questionsAnsweredTotal = prevAnswered + answeredCount;

  const exam = calculateExamReadiness({
    topicStates,
    examDate,
    questionsAnsweredTotal,
    daysActive: Math.max(1, daysActive),
  });

  const examReadiness = {
    score: exam.score,
    verdict: exam.verdict,
    weakestTopics: exam.weakestTopics,
    estimatedReadyDate: exam.estimatedReadyDate
      ? exam.estimatedReadyDate.toISOString()
      : null,
    dailyRecommendation: exam.dailyRecommendation,
  };

  await supabase
    .from("study_sessions")
    .update({
      session_insights: sessionInsights as unknown as Record<string, unknown>,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  await supabase
    .from("profiles")
    .update({
      exam_readiness_score: exam.score,
      questions_answered_total: questionsAnsweredTotal,
    })
    .eq("id", userId);

  return { sessionInsights, examReadiness };
}
