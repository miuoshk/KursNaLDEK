import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CalibrationData } from "@/features/session/lib/antares/confidenceCalibration";
import {
  calculateExamReadiness,
  type TopicKnowledgeState,
} from "@/features/session/lib/antares/examReadiness";
import {
  getRetrievability,
  type RetrievabilityInput,
} from "@/features/session/lib/antares/retrievability";
import type {
  SessionAnswerData,
  SessionInsights,
} from "@/features/session/lib/antares/sessionInsights";
import { generateSessionInsights } from "@/features/session/lib/antares/sessionInsights";
import { normalizeTrack } from "@/features/access/lib/studyAccess";
import { recalculateTopicMastery } from "@/features/session/lib/antares/recalculateTopicMastery";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import type { SessionInsightsPayload } from "@/features/session/summaryTypes";
import { loadMemoryParameterSetById } from "@/features/session/server/loadMemorySchedulerConfig";
import {
  normalizeTopicMasteryRow,
  TOPIC_MASTERY_CACHE_SELECT,
} from "@/features/session/lib/antares/topicMasteryCacheDb";
import { logPerf } from "@/features/session/lib/perfLog";
type AnswerRow = {
  question_id: string;
  is_correct: boolean;
  confidence: string | null;
  time_spent_seconds: number | null;
  question_order: number | null;
  answered_at: string | null;
  retrievability_before: number | null;
  retrievability_after: number | null;
};

export type PostAntaresAnswerRow = AnswerRow;

export const SESSION_ANSWER_ANTARES_SELECT =
  "question_id, is_correct, question_order, time_spent_seconds, confidence, answered_at, retrievability_before, retrievability_after";

export function mapAnswerRowsForPostAntares(
  rows: Array<{
    question_id: unknown;
    is_correct: unknown;
    confidence?: unknown;
    time_spent_seconds?: unknown;
    question_order?: unknown;
    answered_at?: unknown;
    retrievability_before?: unknown;
    retrievability_after?: unknown;
  }>,
): AnswerRow[] {
  return rows.map((a) => ({
    question_id: a.question_id as string,
    is_correct: Boolean(a.is_correct),
    confidence: (a.confidence as string | null) ?? null,
    time_spent_seconds: (a.time_spent_seconds as number | null) ?? null,
    question_order: (a.question_order as number | null) ?? null,
    answered_at: (a.answered_at as string | null) ?? null,
    retrievability_before: (a.retrievability_before as number | null) ?? null,
    retrievability_after: (a.retrievability_after as number | null) ?? null,
  }));
}

export async function loadTopicIdsForQuestions(
  supabase: SupabaseClient,
  questionIds: string[],
): Promise<string[]> {
  const ids = [...new Set(questionIds.filter(Boolean))];
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("questions")
    .select("topic_id")
    .in("id", ids);
  if (error) {
    console.error("[loadTopicIdsForQuestions]", error);
    return [];
  }
  return [
    ...new Set(
      (data ?? [])
        .map((row) => (row.topic_id as string | null) ?? null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
}

export type PostAntaresPhase = "tips" | "full";

export async function computeAndStoreSessionInsights(
  supabase: SupabaseClient,
  input: {
    userId: string;
    sessionId: string;
    ansRows: AnswerRow[];
    answeredCount: number;
    adaptiveFeedbackEnabled: boolean;
    engineVariant: "shadow" | "treatment";
    parameterSetId: string | null;
    /** `tips` = tylko nextSessionFocus/kalibracja. `full` = + mastery + exam. */
    phase?: PostAntaresPhase;
  },
): Promise<PostAntaresResult | null> {
  const topicIds = await loadTopicIdsForQuestions(
    supabase,
    input.ansRows.map((row) => row.question_id),
  );
  return runCompleteSessionPostAntares(
    supabase,
    input.userId,
    input.sessionId,
    topicIds,
    input.ansRows,
    input.answeredCount,
    input.adaptiveFeedbackEnabled,
    {
      engineVariant: input.engineVariant,
      parameterSetId: input.parameterSetId,
    },
    input.phase ?? "full",
  );
}

function rowToRInput(row: {
  stability: unknown;
  difficulty_rating: unknown;
  elapsed_days: unknown;
  scheduled_days: unknown;
  learning_steps?: unknown;
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
    learning_steps: Number(row.learning_steps ?? 0),
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
 * Po zamknięciu sesji: najpierw zapisuje wskazówki (żeby podsumowanie nie czekało
 * na mastery/exam), potem przelicza cache tematów i gotowość egzaminacyjną.
 */
export async function runCompleteSessionPostAntares(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  affectedTopicIds: string[],
  ansRows: AnswerRow[],
  answeredCount: number,
  adaptiveFeedbackEnabled: boolean,
  memory: {
    engineVariant: "shadow" | "treatment";
    parameterSetId: string | null;
  },
  phase: PostAntaresPhase = "full",
): Promise<PostAntaresResult | null> {
  if (ansRows.length === 0) {
    return null;
  }
  const admin = createAdminClient();

  const masteryBefore = await fetchMasteryMap(
    supabase,
    userId,
    affectedTopicIds,
  );

  const profileRow = await getProfileByUserId(userId);
  const viewerTrack = normalizeTrack(profileRow?.current_track);
  const schedulerSettings =
    memory.engineVariant === "treatment"
      ? await loadMemoryParameterSetById(admin, memory.parameterSetId)
      : undefined;

  const qids = [...new Set(ansRows.map((a) => a.question_id as string))];

  const [{ data: qRows }, { data: uqpRows }, { data: leechEv }] =
    await Promise.all([
      supabase.from("questions").select("id, topic_id").in("id", qids),
      supabase
        .from("user_question_progress")
        .select(
          "question_id, stability, difficulty_rating, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, next_review, last_answered_at",
        )
        .eq("user_id", userId)
        .in("question_id", qids),
      supabase
        .from("learning_events")
        .select("question_id")
        .eq("user_id", userId)
        .eq("event_type", "leech_hit")
        .eq("session_id", sessionId)
        .in("question_id", qids),
    ]);

  const topicByQ = new Map(
    (qRows ?? []).map((q) => [q.id as string, q.topic_id as string]),
  );

  const uqpByQ = new Map(
    (uqpRows ?? []).map((r) => [r.question_id as string, r]),
  );

  const newLeechQuestionIds: string[] = [];
  for (const e of leechEv ?? []) {
    if (e.question_id && qids.includes(e.question_id as string)) {
      newLeechQuestionIds.push(e.question_id as string);
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

    const hasStoredRetrievability =
      a.retrievability_before != null &&
      a.retrievability_after != null &&
      Number.isFinite(Number(a.retrievability_before)) &&
      Number.isFinite(Number(a.retrievability_after));
    let rBefore = Number(a.retrievability_before ?? 0);
    let rAfter = Number(a.retrievability_after ?? 0);

    const uqp = uqpByQ.get(qid);
    if (uqp) {
      const rNow = getRetrievability(rowToRInput(uqp));
      if (!hasStoredRetrievability) {
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
      .eq("is_inbox", false)
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
    masteryBefore,
    newLeechQuestionIds,
    topicNamesById,
  );
  if (!adaptiveFeedbackEnabled) {
    insights.fatigueWarning = null;
  }

  const sessionInsights = serializeInsights(insights);

  const { error: tipsWriteErr } = await admin
    .from("study_sessions")
    .update({
      session_insights: sessionInsights as unknown as Record<string, unknown>,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (tipsWriteErr) {
    console.error(
      "[postAntares] session_insights tips write",
      tipsWriteErr.message,
      tipsWriteErr,
    );
    throw tipsWriteErr;
  }
  logPerf("completeSession after() session_insights written", {
    sessionId,
    affectedTopicCount: affectedTopicIds.length,
    phase: "tips",
  });

  if (phase === "tips") {
    return {
      sessionInsights,
      examReadiness: {
        score: 0,
        verdict: "",
        weakestTopics: [],
        estimatedReadyDate: null,
        dailyRecommendation: 25,
      },
    };
  }

  try {
    await recalculateTopicMastery(admin, userId, affectedTopicIds, viewerTrack, {
      engineVariant: memory.engineVariant,
      schedulerSettings,
    });
  } catch (err) {
    console.error("[postAntares] recalculateTopicMastery", err);
  }

  const masteryAfter = await fetchMasteryMap(
    supabase,
    userId,
    affectedTopicIds,
  );
  const masteryTopicIds = new Set([
    ...masteryBefore.keys(),
    ...masteryAfter.keys(),
  ]);
  sessionInsights.masteryDelta = [...masteryTopicIds].map((tid) => ({
    topicId: tid,
    delta: (masteryAfter.get(tid) ?? 0) - (masteryBefore.get(tid) ?? 0),
  }));

  let examReadiness: PostAntaresResult["examReadiness"] | null = null;
  let questionsAnsweredTotal: number | null = null;
  let examScore: number | null = null;

  try {
    const { data: allCache } = await supabase
      .from("topic_mastery_cache")
      .select(TOPIC_MASTERY_CACHE_SELECT)
      .eq("user_id", userId);

    const cacheTopicIds = (allCache ?? []).map((r) => r.topic_id as string);
    let topicMeta: { id: string; name: string; subject_id: string }[] = [];
    if (cacheTopicIds.length > 0) {
      const { data } = await supabase
        .from("topics")
        .select("id, name, subject_id")
        .eq("is_inbox", false)
        .in("id", cacheTopicIds);
      topicMeta = (data ?? []) as {
        id: string;
        name: string;
        subject_id: string;
      }[];
    }

    const metaByT = new Map(
      topicMeta.map((t) => [
        t.id as string,
        { name: t.name as string, subject_id: t.subject_id as string },
      ]),
    );

    const topicStates: TopicKnowledgeState[] = (allCache ?? []).map((raw) => {
      const r = normalizeTopicMasteryRow(raw as Record<string, unknown>);
      const tid = r.topic_id;
      const meta = metaByT.get(tid);
      const trend = r.trend;
      const tr: TopicKnowledgeState["trend"] =
        trend === "improving" || trend === "declining" || trend === "stable"
          ? trend
          : "stable";
      return {
        topicId: tid,
        subjectId: meta?.subject_id ?? "",
        topicName: meta?.name ?? tid,
        totalQuestions: r.total_questions,
        seenQuestions: r.seen,
        coverageRatio: r.coverage,
        accuracy: r.accuracy,
        avgRetrievability: r.avg_retrievability,
        masteryScore: r.mastery_score,
        weaknessRank: r.weakness_rank ?? 999,
        trend: tr,
        questionsLast7d: r.questions_last_7d,
        accuracyLast7d: r.accuracy_last_7d,
        leechCount: r.leech_count,
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
    questionsAnsweredTotal = prevAnswered + answeredCount;

    const exam = calculateExamReadiness({
      topicStates,
      examDate,
      questionsAnsweredTotal,
      daysActive: Math.max(1, daysActive),
      sessionAccuracy: sessionInsights.accuracy,
    });

    examScore = exam.score;
    examReadiness = {
      score: exam.score,
      verdict: exam.verdict,
      weakestTopics: exam.weakestTopics,
      estimatedReadyDate: exam.estimatedReadyDate
        ? exam.estimatedReadyDate.toISOString()
        : null,
      dailyRecommendation: exam.dailyRecommendation,
    };
  } catch (err) {
    console.error("[postAntares] examReadiness", err);
  }

  const { error: insightsErr } = await admin
    .from("study_sessions")
    .update({
      session_insights: {
        ...sessionInsights,
        ...(examReadiness ? { examReadiness } : {}),
      } as unknown as Record<string, unknown>,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (insightsErr) {
    console.error(
      "[postAntares] session_insights exam merge",
      insightsErr.message,
      insightsErr,
    );
  } else {
    logPerf("completeSession after() session_insights written", {
      sessionId,
      affectedTopicCount: affectedTopicIds.length,
      phase: "exam",
    });
  }

  if (examReadiness && examScore != null && questionsAnsweredTotal != null) {
    const { error: profileErr } = await admin
      .from("profiles")
      .update({
        exam_readiness_score: examScore,
        questions_answered_total: questionsAnsweredTotal,
      })
      .eq("id", userId);

    if (profileErr) {
      console.error(
        "[postAntares] profile update",
        profileErr.message,
        profileErr,
      );
    }
  }

  return {
    sessionInsights,
    examReadiness: examReadiness ?? {
      score: 0,
      verdict: "",
      weakestTopics: [],
      estimatedReadyDate: null,
      dailyRecommendation: 25,
    },
  };
}
