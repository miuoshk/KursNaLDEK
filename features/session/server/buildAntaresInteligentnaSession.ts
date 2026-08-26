import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudyTrack } from "@/features/access/lib/studyAccess";
import { questionTracksOrFilter } from "@/lib/content/topicTrackVisibility";
import {
  buildQuestionMeta,
  defaultQuestionMeta,
} from "@/features/session/lib/antares/questionMeta";
import {
  composeSession,
  type RankedQuestion,
} from "@/features/session/lib/antares/sessionComposer";
import {
  getRetrievability,
  type RetrievabilityInput,
} from "@/features/session/lib/antares/retrievability";
import {
  normalizeTopicMasteryRow,
  TOPIC_MASTERY_CACHE_SELECT,
} from "@/features/session/lib/antares/topicMasteryCacheDb";
import { calculateLearningValueScore } from "@/features/session/lib/antares/learningValueScore";
import { countSessionAnswersTodayWarsaw } from "@/features/pulpit/server/countQuestionsToday";
import { shuffle } from "@/features/session/server/questionSelection";
import { fetchAnsweredQuestionIdsInPool } from "@/features/session/server/sessionQuestionMix";
import type {
  SessionQuestionMeta,
  SourceFilter,
} from "@/features/session/types";
import {
  buildReserveQuestionIds,
  mergeRankedUnique,
} from "@/features/session/lib/antares/reservePool";
import { filterUnseenHoldingCemReserve } from "@/features/session/lib/antares/cemReserve";
import { resolveEngineSourceFilter } from "@/features/session/lib/sourceFilter";
import { hasCemExams, referenceSources } from "@/lib/products";
import { MEMORY_SCHEDULER_VERSION } from "@/features/session/lib/memory/scheduler";
import type { MemoryEngineVariant } from "@/features/session/lib/experiments/memoryV2Experiment";
import { deriveRetentionPolicy } from "@/features/session/lib/memory/retentionPolicy";
import { estimateQuestionSeconds } from "@/features/session/lib/dailyPlan";
import { loadMemorySchedulerConfig } from "@/features/session/server/loadMemorySchedulerConfig";

const MAX_DUE_CANDIDATES = 800;
const MAX_UNSEEN_CANDIDATES = 800;

export type AntaresSessionBuildResult = {
  questionIds: string[];
  reserveIds: string[];
  fallbackIds: string[];
  metaByQuestionId: Map<string, SessionQuestionMeta>;
};

function toRetrieverState(s: string): RetrievabilityInput["state"] {
  if (s === "new" || s === "learning" || s === "review" || s === "relearning") {
    return s;
  }
  return "new";
}

function rowToRetrievabilityInput(row: {
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
  return {
    stability: Number(row.stability ?? 0),
    difficulty_rating: Number(row.difficulty_rating ?? 0.3),
    elapsed_days: Number(row.elapsed_days ?? 0),
    scheduled_days: Number(row.scheduled_days ?? 0),
    learning_steps: Number(row.learning_steps ?? 0),
    reps: Number(row.reps ?? 0),
    lapses: Number(row.lapses ?? 0),
    state: toRetrieverState(String(row.state ?? "new")),
    next_review: (row.next_review as string | null) ?? null,
    last_answered_at: (row.last_answered_at as string | null) ?? null,
  };
}

type RankingProgressRow = {
  question_id: string;
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
  is_leech: unknown;
  times_answered: unknown;
  times_correct: unknown;
  avg_time_seconds: unknown;
};

function emptyProgressRow(questionId: string): RankingProgressRow {
  return {
    question_id: questionId,
    stability: 0,
    difficulty_rating: 0.3,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: 0,
    lapses: 0,
    state: "new",
    next_review: null,
    last_answered_at: null,
    is_leech: false,
    times_answered: 0,
    times_correct: 0,
    avg_time_seconds: null,
  };
}

async function loadTreatmentDueRows(
  supabase: SupabaseClient,
  userId: string,
  nowIso: string,
): Promise<RankingProgressRow[] | null> {
  const { data: memoryRows, error } = await supabase
    .from("user_question_memory_v2")
    .select(
      "question_id, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, next_review, last_answered_at",
    )
    .eq("user_id", userId)
    .eq("scheduler_version", MEMORY_SCHEDULER_VERSION)
    .lte("next_review", nowIso)
    .not("next_review", "is", null)
    .order("next_review", { ascending: true })
    .limit(MAX_DUE_CANDIDATES * 2);
  if (error || !memoryRows) return null;
  if (memoryRows.length === 0) return [];

  const questionIds = memoryRows.map((row) => row.question_id as string);
  const { data: supportRows } = await supabase
    .from("user_question_progress")
    .select(
      "question_id, is_leech, times_answered, times_correct, avg_time_seconds",
    )
    .eq("user_id", userId)
    .in("question_id", questionIds);
  const supportByQuestion = new Map(
    (supportRows ?? []).map((row) => [row.question_id as string, row]),
  );

  return memoryRows.map((row) => {
    const support = supportByQuestion.get(row.question_id as string);
    return {
      question_id: row.question_id as string,
      stability: row.stability,
      difficulty_rating: row.difficulty,
      elapsed_days: row.elapsed_days,
      scheduled_days: row.scheduled_days,
      learning_steps: row.learning_steps,
      reps: row.reps,
      lapses: row.lapses,
      state: row.state,
      next_review: row.next_review,
      last_answered_at: row.last_answered_at,
      is_leech: support?.is_leech ?? false,
      times_answered: support?.times_answered ?? row.reps,
      times_correct: support?.times_correct ?? 0,
      avg_time_seconds: support?.avg_time_seconds ?? null,
    };
  });
}

async function overlayTreatmentMemoryForLeeches(
  supabase: SupabaseClient,
  userId: string,
  legacyRows: RankingProgressRow[],
): Promise<RankingProgressRow[]> {
  if (legacyRows.length === 0) return legacyRows;
  const { data: memoryRows } = await supabase
    .from("user_question_memory_v2")
    .select(
      "question_id, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, next_review, last_answered_at",
    )
    .eq("user_id", userId)
    .eq("scheduler_version", MEMORY_SCHEDULER_VERSION)
    .in(
      "question_id",
      legacyRows.map((row) => row.question_id),
    );
  const memoryByQuestion = new Map(
    (memoryRows ?? []).map((row) => [row.question_id as string, row]),
  );

  return legacyRows.map((row) => {
    const memory = memoryByQuestion.get(row.question_id);
    return memory
      ? {
          ...row,
          stability: memory.stability,
          difficulty_rating: memory.difficulty,
          elapsed_days: memory.elapsed_days,
          scheduled_days: memory.scheduled_days,
          learning_steps: memory.learning_steps,
          reps: memory.reps,
          lapses: memory.lapses,
          state: memory.state,
          next_review: memory.next_review,
          last_answered_at: memory.last_answered_at,
        }
      : row;
  });
}

export type AntaresSessionBuildOpts = {
  source?: SourceFilter;
  product?: string | null;
  protectCemPool?: boolean;
  engineVariant?: MemoryEngineVariant;
  dailyPlanMix?: {
    due: number;
    new: number;
    remediation: number;
  };
};

type QuestionMetaRow = {
  topic_id: string;
  source?: string;
  reserve_bucket?: number;
  repeat_count?: number;
  concepts: Array<{ id: string; weight: number }>;
};

async function fetchQuestionsMeta(
  supabase: SupabaseClient,
  ids: string[],
  track: StudyTrack,
  source: SourceFilter,
  product: string | null | undefined,
): Promise<Map<string, QuestionMetaRow>> {
  const out = new Map<string, QuestionMetaRow>();
  if (ids.length === 0) return out;
  const includeReserveCols = hasCemExams(product);
  const select = includeReserveCols
    ? "id, topic_id, source, reserve_bucket, repeat_count, question_concepts(concept_id, weight), topics!inner(is_inbox)"
    : "id, topic_id, question_concepts(concept_id, weight), topics!inner(is_inbox)";
  const resolved = resolveEngineSourceFilter(source, product);
  const chunk = 200;
  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk);
    // is_inbox = false bez bramki — poczekalnia nigdy nie wchodzi do silnika.
    // $source to filtr abstrakcyjny: all | reference | own.
    // reference → q.source IN referenceSources(product); own → q.source = 'own';
    // all / OSCE → brak warunku (nie pusta pula).
    let query = supabase
      .from("questions")
      .select(select as "id, topic_id, topics!inner(is_inbox)")
      .in("id", slice)
      .eq("is_active", true)
      .eq("topics.is_inbox", false);
    if (resolved === "own") {
      query = query.eq("source", "own");
    } else if (resolved === "reference") {
      query = query.in("source", referenceSources(product));
    }
    const { data: rows } = await query.or(questionTracksOrFilter(track));
    for (const r of rows ?? []) {
      const row = r as unknown as {
        id: string;
        topic_id: string;
        source?: string;
        reserve_bucket?: number | null;
        repeat_count?: number | null;
        question_concepts?: Array<{
          concept_id: string;
          weight: number | null;
        }> | null;
      };
      out.set(row.id, {
        topic_id: row.topic_id,
        source: includeReserveCols ? row.source : undefined,
        reserve_bucket: includeReserveCols
          ? Number(row.reserve_bucket ?? 0)
          : undefined,
        repeat_count: includeReserveCols
          ? Number(row.repeat_count ?? 0)
          : undefined,
        concepts: (row.question_concepts ?? []).map((link) => ({
          id: link.concept_id,
          weight: Number(link.weight ?? 1),
        })),
      });
    }
  }
  return out;
}

async function loadQuestionConceptMastery(
  supabase: SupabaseClient,
  userId: string,
  questionMeta: Map<string, QuestionMetaRow>,
): Promise<Map<string, number>> {
  const conceptIds = [
    ...new Set(
      [...questionMeta.values()].flatMap((question) =>
        question.concepts.map((concept) => concept.id),
      ),
    ),
  ];
  if (conceptIds.length === 0) return new Map();

  const { data } = await supabase
    .from("user_concept_state")
    .select("concept_id, mastery_score")
    .eq("user_id", userId)
    .in("concept_id", conceptIds);
  const masteryByConcept = new Map(
    (data ?? []).map((row) => [
      row.concept_id as string,
      Number(row.mastery_score ?? 0),
    ]),
  );

  const output = new Map<string, number>();
  for (const [questionId, question] of questionMeta) {
    let weighted = 0;
    let totalWeight = 0;
    for (const concept of question.concepts) {
      const mastery = masteryByConcept.get(concept.id);
      if (mastery == null) continue;
      weighted += mastery * concept.weight;
      totalWeight += concept.weight;
    }
    if (totalWeight > 0) output.set(questionId, weighted / totalWeight);
  }
  return output;
}

async function loadSavedQuestionContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ conceptIds: Set<string>; questionIds: Set<string> }> {
  const { data: savedRows } = await supabase
    .from("saved_questions")
    .select("question_id")
    .eq("user_id", userId)
    .limit(1000);
  const questionIds = new Set(
    (savedRows ?? []).map((row) => row.question_id as string),
  );
  if (questionIds.size === 0) {
    return { conceptIds: new Set(), questionIds };
  }

  const { data: links } = await supabase
    .from("question_concepts")
    .select("concept_id")
    .eq("relation", "primary")
    .in("question_id", [...questionIds]);
  return {
    conceptIds: new Set(
      (links ?? []).map((link) => link.concept_id as string),
    ),
    questionIds,
  };
}

function savedConceptSignal(
  question: QuestionMetaRow,
  savedConceptIds: Set<string>,
): number {
  return question.concepts.some((concept) => savedConceptIds.has(concept.id))
    ? 1
    : 0;
}

function allowedQuestion(
  qid: string,
  meta: Map<string, QuestionMetaRow>,
  topicOkForDue: Set<string>,
  topicFilter: Set<string> | undefined,
): boolean {
  const m = meta.get(qid);
  if (!m) return false;
  if (!topicOkForDue.has(m.topic_id)) return false;
  if (topicFilter && !topicFilter.has(qid)) return false;
  return true;
}

async function fetchAccuracyLast20(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("id")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(400);

  const sessionIds = (sessions ?? []).map((s) => s.id as string);
  if (sessionIds.length === 0) return 0.5;

  const { data: answers } = await supabase
    .from("session_answers")
    .select("is_correct, answered_at")
    .in("session_id", sessionIds)
    .order("answered_at", { ascending: false })
    .limit(20);

  const list = answers ?? [];
  if (list.length === 0) return 0.5;
  const correct = list.filter((a) => a.is_correct).length;
  return correct / list.length;
}

function metaFromRankedMap(
  questionIds: string[],
  rankedById: Map<string, RankedQuestion>,
): Map<string, SessionQuestionMeta> {
  const out = new Map<string, SessionQuestionMeta>();
  for (const id of questionIds) {
    const ranked = rankedById.get(id);
    if (ranked?.antares) {
      out.set(id, ranked.antares);
    }
  }
  return out;
}

/**
 * Buduje listę identyfikatorów pytań dla trybu inteligentna (ANTARES).
 * Zwraca pustą tablicę, gdy brak danych do kompozycji — wtedy `startSession` może użyć fallbacku.
 */
export async function buildAntaresInteligentnaSession(
  supabase: SupabaseClient,
  userId: string,
  count: number,
  pool: string[],
  topicOkForDue: Set<string>,
  topicFilter: Set<string> | undefined,
  track: StudyTrack,
  opts: AntaresSessionBuildOpts = {},
): Promise<AntaresSessionBuildResult> {
  const empty: AntaresSessionBuildResult = {
    questionIds: [],
    reserveIds: [],
    fallbackIds: [],
    metaByQuestionId: new Map(),
  };

  const source = resolveEngineSourceFilter(opts.source, opts.product);
  const product = opts.product ?? null;
  const protectCemPool = opts.protectCemPool ?? true;

  const poolSet = new Set(pool);
  const now = new Date();
  const nowIso = now.toISOString();
  const rankingSchedulerSettings =
    opts.engineVariant === "treatment"
      ? await loadMemorySchedulerConfig(supabase, userId, {
          product,
          track,
        })
      : undefined;

  const [{ data: profile }, questionsToday, accuracyLast20, savedContext] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "daily_study_minutes, average_question_seconds, exam_date, protect_cem_pool",
        )
        .eq("id", userId)
        .maybeSingle(),
      countSessionAnswersTodayWarsaw(supabase, userId),
      fetchAccuracyLast20(supabase, userId),
      loadSavedQuestionContext(supabase, userId),
    ]);
  const savedConceptIds = savedContext.conceptIds;

  const examDateRaw = profile?.exam_date as string | null | undefined;
  const examDate = examDateRaw ? new Date(examDateRaw) : null;
  const protectFromProfile = profile?.protect_cem_pool;
  const poolProtect =
    typeof protectFromProfile === "boolean"
      ? protectFromProfile
      : protectCemPool;

  let hasPublishedCemSession = false;
  if (hasCemExams(product)) {
    const { count: publishedCount } = await supabase
      .from("cem_sessions")
      .select("id", { count: "exact", head: true })
      .eq("product", product)
      .eq("is_published", true);
    hasPublishedCemSession = (publishedCount ?? 0) > 0;
  }

  const { data: cacheRows } = await supabase
    .from("topic_mastery_cache")
    .select(TOPIC_MASTERY_CACHE_SELECT)
    .eq("user_id", userId);

  const topicMastery = new Map<string, number>();
  const topicCoverage = new Map<string, number>();
  for (const raw of cacheRows ?? []) {
    const r = normalizeTopicMasteryRow(raw as Record<string, unknown>);
    topicMastery.set(r.topic_id, r.mastery_score);
    topicCoverage.set(r.topic_id, r.coverage);
  }

  const legacyDueResult = await supabase
    .from("user_question_progress")
    .select(
      "question_id, stability, difficulty_rating, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, next_review, last_answered_at, is_leech, times_answered, times_correct, avg_time_seconds",
    )
    .eq("user_id", userId)
    .lte("next_review", nowIso)
    .not("next_review", "is", null)
    .order("next_review", { ascending: true });
  const treatmentDueRows =
    opts.engineVariant === "treatment"
      ? await loadTreatmentDueRows(supabase, userId, nowIso)
      : null;
  const dueRows =
    treatmentDueRows ??
    ((legacyDueResult.data ?? []) as unknown as RankingProgressRow[]);
  const retentionPolicy = deriveRetentionPolicy({
    dailyMinutes: Number(profile?.daily_study_minutes ?? 25),
    dueCount: dueRows.length,
    averageQuestionSeconds: estimateQuestionSeconds(
      profile?.average_question_seconds,
    ),
    examDate: examDateRaw ?? null,
    now,
  });
  const dailyGoal = retentionPolicy.dailyCapacity;

  const { data: legacyLeechRows } = await supabase
    .from("user_question_progress")
    .select(
      "question_id, stability, difficulty_rating, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, next_review, last_answered_at, is_leech, times_answered, times_correct, avg_time_seconds",
    )
    .eq("user_id", userId)
    .eq("is_leech", true);
  const leechRows =
    opts.engineVariant === "treatment"
      ? await overlayTreatmentMemoryForLeeches(
          supabase,
          userId,
          (legacyLeechRows ?? []) as unknown as RankingProgressRow[],
        )
      : ((legacyLeechRows ?? []) as unknown as RankingProgressRow[]);

  const extraSavedIds = opts.dailyPlanMix
    ? [...savedContext.questionIds]
        .filter((id) => poolSet.has(id))
        .filter(
          (id) => !leechRows.some((row) => row.question_id === id),
        )
        .slice(0, 80)
    : [];
  let extraSavedRows: RankingProgressRow[] = [];
  if (extraSavedIds.length > 0) {
    const { data: savedProgressRows } = await supabase
      .from("user_question_progress")
      .select(
        "question_id, stability, difficulty_rating, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, next_review, last_answered_at, is_leech, times_answered, times_correct, avg_time_seconds",
      )
      .eq("user_id", userId)
      .in("question_id", extraSavedIds);
    const savedById = new Map(
      ((savedProgressRows ?? []) as unknown as RankingProgressRow[]).map(
        (row) => [row.question_id, row] as const,
      ),
    );
    extraSavedRows = extraSavedIds.map(
      (id) => savedById.get(id) ?? emptyProgressRow(id),
    );
    if (opts.engineVariant === "treatment") {
      extraSavedRows = await overlayTreatmentMemoryForLeeches(
        supabase,
        userId,
        extraSavedRows,
      );
    }
  }
  const remediationRows = [...leechRows, ...extraSavedRows];

  const answeredInPool = await fetchAnsweredQuestionIdsInPool(
    supabase,
    userId,
    pool,
  );
  const unseenInPool = pool.filter((id) => !answeredInPool.has(id));

  const allCandidateIds = [
    ...new Set([
      ...(dueRows ?? []).map((r) => r.question_id as string),
      ...remediationRows.map((r) => r.question_id as string),
      ...unseenInPool.slice(0, MAX_UNSEEN_CANDIDATES),
    ]),
  ];

  const meta = await fetchQuestionsMeta(
    supabase,
    allCandidateIds,
    track,
    source,
    product,
  );
  const conceptMastery = await loadQuestionConceptMastery(
    supabase,
    userId,
    meta,
  );
  const rankedById = new Map<string, RankedQuestion>();

  const dueRanked: RankedQuestion[] = [];
  for (const row of dueRows ?? []) {
    const qid = row.question_id as string;
    if (!poolSet.has(qid)) continue;
    if (!allowedQuestion(qid, meta, topicOkForDue, topicFilter)) continue;
    const m = meta.get(qid);
    if (!m) continue;

    const rInput = rowToRetrievabilityInput(row);
    const rVal = getRetrievability(rInput, now, rankingSchedulerSettings);
    const tid = m.topic_id;
    const tm = conceptMastery.get(qid) ?? topicMastery.get(tid) ?? 0.5;
    const dueAt = new Date((row.next_review as string) ?? nowIso);
    const overdueDays = Math.max(
      0,
      (now.getTime() - dueAt.getTime()) / 86_400_000,
    );
    const urgency = calculateLearningValueScore({
      retrievability: rVal,
      mastery: tm,
      averageTimeSeconds:
        row.avg_time_seconds != null ? Number(row.avg_time_seconds) : null,
      source: m.source,
      repeatCount: m.repeat_count,
      isLeech: Boolean(row.is_leech),
      overdueDays,
      conceptPrioritySignal: savedConceptSignal(m, savedConceptIds),
    });

    const antares = buildQuestionMeta({
      retrievability: rVal,
      fsrsDifficulty: Number(row.difficulty_rating ?? 0.3),
      isLeech: Boolean(row.is_leech),
      isNew: false,
      timesAnswered: Number(row.times_answered ?? 0),
      timesCorrect: Number(row.times_correct ?? 0),
      avgTimeSeconds:
        row.avg_time_seconds != null ? Number(row.avg_time_seconds) : null,
      topicMastery: tm,
    });

    const ranked: RankedQuestion = {
      questionId: qid,
      topicId: tid,
      score: urgency,
      isLeech: Boolean(row.is_leech),
      retrievability: rVal,
      antares,
      source: m.source,
      reserveBucket: m.reserve_bucket,
    };
    dueRanked.push(ranked);
    rankedById.set(qid, ranked);
  }

  dueRanked.sort((a, b) => b.score - a.score);
  const dueSorted = dueRanked.slice(0, MAX_DUE_CANDIDATES);

  const leechRanked: RankedQuestion[] = [];
  for (const row of remediationRows) {
    const qid = row.question_id as string;
    if (!poolSet.has(qid)) continue;
    if (!allowedQuestion(qid, meta, topicOkForDue, topicFilter)) continue;
    const m = meta.get(qid);
    if (!m) continue;

    const rInput = rowToRetrievabilityInput(row);
    const rVal = getRetrievability(rInput, now, rankingSchedulerSettings);
    const tid = m.topic_id;
    const tm = conceptMastery.get(qid) ?? topicMastery.get(tid) ?? 0.5;
    const dueAt = new Date((row.next_review as string) ?? nowIso);
    const overdueDays = Math.max(
      0,
      (now.getTime() - dueAt.getTime()) / 86_400_000,
    );
    const isLeech = Boolean(row.is_leech);
    const urgency = calculateLearningValueScore({
      retrievability: rVal,
      mastery: tm,
      averageTimeSeconds:
        row.avg_time_seconds != null ? Number(row.avg_time_seconds) : null,
      source: m.source,
      repeatCount: m.repeat_count,
      isLeech,
      overdueDays,
      conceptPrioritySignal:
        savedContext.questionIds.has(qid) ||
        savedConceptSignal(m, savedConceptIds)
          ? 1
          : 0,
    });

    const antares = buildQuestionMeta({
      retrievability: rVal,
      fsrsDifficulty: Number(row.difficulty_rating ?? 0.3),
      isLeech,
      isNew: String(row.state ?? "") === "new",
      timesAnswered: Number(row.times_answered ?? 0),
      timesCorrect: Number(row.times_correct ?? 0),
      avgTimeSeconds:
        row.avg_time_seconds != null ? Number(row.avg_time_seconds) : null,
      topicMastery: tm,
    });

    const ranked: RankedQuestion = {
      questionId: qid,
      topicId: tid,
      score: urgency,
      isLeech,
      retrievability: rVal,
      antares,
      source: m.source,
      reserveBucket: m.reserve_bucket,
    };
    leechRanked.push(ranked);
    rankedById.set(qid, ranked);
  }
  leechRanked.sort((a, b) => b.score - a.score);

  const unseenRanked: RankedQuestion[] = [];
  for (const qid of shuffle(unseenInPool).slice(0, MAX_UNSEEN_CANDIDATES)) {
    if (!allowedQuestion(qid, meta, topicOkForDue, topicFilter)) continue;
    const m = meta.get(qid);
    if (!m) continue;

    const tid = m.topic_id;
    const mastery = conceptMastery.get(qid) ?? topicMastery.get(tid) ?? 0;
    const coverageRatio = topicCoverage.get(tid) ?? 0;
    const priority =
      calculateLearningValueScore({
        retrievability: 0,
        mastery,
        averageTimeSeconds: null,
        source: m.source,
        repeatCount: m.repeat_count,
        isNew: true,
        conceptPrioritySignal: savedConceptSignal(m, savedConceptIds),
      }) *
      (1 + (1 - coverageRatio) * 0.25);

    const antares = defaultQuestionMeta(mastery);
    const ranked: RankedQuestion = {
      questionId: qid,
      topicId: tid,
      score: priority,
      isLeech: false,
      retrievability: 0,
      antares,
      source: m.source,
      reserveBucket: m.reserve_bucket,
    };
    unseenRanked.push(ranked);
    rankedById.set(qid, ranked);
  }
  unseenRanked.sort((a, b) => b.score - a.score);

  const reserveEligibleUnseen = filterUnseenHoldingCemReserve(unseenRanked, {
    protectCemPool: poolProtect,
    product,
    source,
    hasPublishedCemSession,
    topicMastery,
    examDate,
    now,
  });
  const eligibleFallbackIds = [
    ...new Set([
      ...mergeRankedUnique([
        dueSorted,
        reserveEligibleUnseen,
        leechRanked,
      ]).map((question) => question.questionId),
      // Seen, not-yet-due questions are safe manual fallback material. Unseen
      // questions omitted by the protected CEM filter must never re-enter here.
      ...pool.filter((questionId) => answeredInPool.has(questionId)),
    ]),
  ];

  const composed = composeSession({
    userId,
    count,
    dueQuestions: dueSorted,
    unseenQuestions: unseenRanked,
    leechQuestions: leechRanked,
    topicMastery,
    accuracyLast20,
    dailyGoal,
    questionsToday,
    examDate,
    prioritizeUnseen: topicFilter != null && unseenRanked.length > 0,
    protectCemPool: poolProtect,
    source,
    product,
    hasPublishedCemSession,
    targetMix: opts.dailyPlanMix,
  });

  if (composed.questionIds.length === 0) {
    return { ...empty, fallbackIds: eligibleFallbackIds };
  }

  // The adaptive reserve must obey the same protected-CEM holdout as the
  // initial composition. Otherwise a held-out unseen CEM item could leak into
  // the live session through a fatigue or concept-transfer swap.
  const allRanked = mergeRankedUnique([
    dueSorted,
    reserveEligibleUnseen,
    leechRanked,
  ]);
  const reserveIds = buildReserveQuestionIds(
    count,
    composed.questionIds,
    allRanked,
  );

  const metaIds = [...composed.questionIds, ...reserveIds];
  return {
    questionIds: composed.questionIds,
    reserveIds,
    fallbackIds: eligibleFallbackIds,
    metaByQuestionId: metaFromRankedMap(metaIds, rankedById),
  };
}
