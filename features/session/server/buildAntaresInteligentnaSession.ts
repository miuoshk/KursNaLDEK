import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudyTrack } from "@/features/access/lib/studyAccess";
import { questionTracksOrFilter } from "@/lib/content/topicTrackVisibility";
import { calculateNewQuestionPriority } from "@/features/session/lib/antares/newQuestionPriority";
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
import { calculateDueUrgency } from "@/features/session/lib/antares/urgencyScore";
import { countSessionAnswersTodayWarsaw } from "@/features/pulpit/server/countQuestionsToday";
import { shuffle } from "@/features/session/server/questionSelection";
import { fetchAnsweredQuestionIdsInPool } from "@/features/session/server/sessionQuestionMix";
import type { SessionQuestionMeta, SourceFilter } from "@/features/session/types";
import {
  buildReserveQuestionIds,
  mergeRankedUnique,
} from "@/features/session/lib/antares/reservePool";
import {
  resolveEngineSourceFilter,
} from "@/features/session/lib/sourceFilter";
import { hasCemExams, referenceSources } from "@/lib/products";

const MAX_DUE_CANDIDATES = 800;
const MAX_UNSEEN_CANDIDATES = 800;

export type AntaresSessionBuildResult = {
  questionIds: string[];
  reserveIds: string[];
  metaByQuestionId: Map<string, SessionQuestionMeta>;
};

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
    state: toRetrieverState(String(row.state ?? "new")),
    next_review: (row.next_review as string | null) ?? null,
    last_answered_at: (row.last_answered_at as string | null) ?? null,
  };
}

export type AntaresSessionBuildOpts = {
  source?: SourceFilter;
  product?: string | null;
  protectCemPool?: boolean;
};

type QuestionMetaRow = {
  topic_id: string;
  source?: string;
  reserve_bucket?: number;
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
    ? "id, topic_id, source, reserve_bucket, topics!inner(is_inbox)"
    : "id, topic_id, topics!inner(is_inbox)";
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
      .select(select)
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
      out.set(r.id as string, {
        topic_id: r.topic_id as string,
        source: includeReserveCols ? (r.source as string | undefined) : undefined,
        reserve_bucket: includeReserveCols
          ? Number(r.reserve_bucket ?? 0)
          : undefined,
      });
    }
  }
  return out;
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
    metaByQuestionId: new Map(),
  };

  const source = resolveEngineSourceFilter(opts.source, opts.product);
  const product = opts.product ?? null;
  const protectCemPool = opts.protectCemPool ?? true;

  const poolSet = new Set(pool);
  const now = new Date();
  const nowIso = now.toISOString();

  const [{ data: profile }, questionsToday, accuracyLast20] = await Promise.all([
    supabase
      .from("profiles")
      .select("daily_goal, exam_date, protect_cem_pool")
      .eq("id", userId)
      .maybeSingle(),
    countSessionAnswersTodayWarsaw(supabase, userId),
    fetchAccuracyLast20(supabase, userId),
  ]);

  const dailyGoal = Number(profile?.daily_goal ?? 25);
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

  const { data: dueRows } = await supabase
    .from("user_question_progress")
    .select(
      "question_id, stability, difficulty_rating, elapsed_days, scheduled_days, reps, lapses, state, next_review, last_answered_at, is_leech, times_answered, times_correct, avg_time_seconds",
    )
    .eq("user_id", userId)
    .lte("next_review", nowIso)
    .not("next_review", "is", null)
    .order("next_review", { ascending: true });

  const { data: leechRows } = await supabase
    .from("user_question_progress")
    .select(
      "question_id, stability, difficulty_rating, elapsed_days, scheduled_days, reps, lapses, state, next_review, last_answered_at, is_leech, times_answered, times_correct, avg_time_seconds",
    )
    .eq("user_id", userId)
    .eq("is_leech", true);

  const answeredInPool = await fetchAnsweredQuestionIdsInPool(
    supabase,
    userId,
    pool,
  );
  const unseenInPool = pool.filter((id) => !answeredInPool.has(id));

  const allCandidateIds = [
    ...new Set([
      ...(dueRows ?? []).map((r) => r.question_id as string),
      ...(leechRows ?? []).map((r) => r.question_id as string),
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
  const rankedById = new Map<string, RankedQuestion>();

  const dueRanked: RankedQuestion[] = [];
  for (const row of dueRows ?? []) {
    const qid = row.question_id as string;
    if (!poolSet.has(qid)) continue;
    if (!allowedQuestion(qid, meta, topicOkForDue, topicFilter)) continue;
    const m = meta.get(qid);
    if (!m) continue;

    const rInput = rowToRetrievabilityInput(row);
    const rVal = getRetrievability(rInput, now);
    const tid = m.topic_id;
    const tm = topicMastery.get(tid) ?? 0.5;
    const urgency = calculateDueUrgency({
      retrievability: rVal,
      nextReviewAt: (row.next_review as string) ?? nowIso,
      topicMasteryScore: tm,
      isLeech: Boolean(row.is_leech),
      now,
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
  for (const row of leechRows ?? []) {
    const qid = row.question_id as string;
    if (!poolSet.has(qid)) continue;
    if (!allowedQuestion(qid, meta, topicOkForDue, topicFilter)) continue;
    const m = meta.get(qid);
    if (!m) continue;

    const rInput = rowToRetrievabilityInput(row);
    const rVal = getRetrievability(rInput, now);
    const tid = m.topic_id;
    const tm = topicMastery.get(tid) ?? 0.5;
    const urgency = calculateDueUrgency({
      retrievability: rVal,
      nextReviewAt: (row.next_review as string) ?? nowIso,
      topicMasteryScore: tm,
      isLeech: true,
      now,
    });

    const antares = buildQuestionMeta({
      retrievability: rVal,
      fsrsDifficulty: Number(row.difficulty_rating ?? 0.3),
      isLeech: true,
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
      isLeech: true,
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
    const mastery = topicMastery.get(tid) ?? 0;
    const coverageRatio = topicCoverage.get(tid) ?? 0;
    const priority = calculateNewQuestionPriority({
      topicMasteryScore: mastery,
      topicCoverageRatio: coverageRatio,
    });

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
  });

  if (composed.questionIds.length === 0) return empty;

  const allRanked = mergeRankedUnique([
    dueSorted,
    unseenRanked,
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
    metaByQuestionId: metaFromRankedMap(metaIds, rankedById),
  };
}
