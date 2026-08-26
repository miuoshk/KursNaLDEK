import { createClient } from "@/lib/supabase/server";
import type { Subject, Topic } from "@/features/subjects/types";
import { hasAccessForSubjectSelection } from "@/features/access/server/guards";
import {
  normalizeTrack,
  type StudyTrack,
} from "@/features/access/lib/studyAccess";
import { isCatalogSubjectHidden } from "@/lib/content/catalogSubjectVisibility";
import { filterTopicsForTrack } from "@/lib/content/topicTrackVisibility";
import {
  countQuestionsByTopic,
  fetchActiveQuestionsForTopics,
} from "@/lib/content/fetchActiveQuestionsForTopics";
import {
  getCanonicalContentSubjectId,
  getTopicDisplaySubjectIds,
} from "@/features/session/server/sharedSubjects";
import { fetchActiveQuestionsForThemeLabel } from "@/lib/content/fetchThemeLabelQuestions";
import {
  buildVirtualThemeTopicId,
  isVirtualThemeTopicId,
  mergeVirtualThemeDefinitions,
} from "@/lib/content/virtualThemeTopics";
import { isFinalExamTopicId } from "@/lib/content/finalExamTopics";
import { FEATURES } from "@/lib/featureFlags";
import {
  hasCemExams,
  isSourceFilterLive,
  referenceSources,
} from "@/lib/products";
import {
  sourceCountsFromTotals,
  type SourceFilterCounts,
} from "@/features/session/lib/sourceFilter";
import type { SourceAccuracyBreakdown } from "@/features/session/lib/sourceAccuracy";
import { CEM_RESERVE_BUCKET_MIN } from "@/features/session/lib/antares/cemReserve";
import { resolveMemoryEngineVariant } from "@/features/session/server/resolveMemoryEngineVariant";
import { MEMORY_SCHEDULER_VERSION } from "@/features/session/lib/memory/scheduler";

export type TopicWithProgress = Topic & {
  answered_count: number;
  correct_count: number;
  knowledge_card: string | null;
  /** Ile razy przerobiono cały temat (min. liczba odpowiedzi na każde pytanie). */
  session_count: number;
  last_studied_at: string | null;
  /** Tylko gdy filtr źródła jest na live dla subjects.product — inaczej nie pobierane. */
  question_count_ref?: number | null;
  answered_count_ref?: number;
  answered_count_own?: number;
};

export type SubjectStats = {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  accuracy: number;
  masteryPct: number;
  nextReviewDate: string | null;
  dueCount: number;
};

export type SubjectDashboardLoadResult =
  | {
      ok: true;
      subject: Subject;
      topics: TopicWithProgress[];
      stats: SubjectStats;
      sourceCounts: SourceFilterCounts | null;
      statsBySource: Record<"all" | "reference" | "own", SubjectStats> | null;
      sourceAccuracy: SourceAccuracyBreakdown | null;
    }
  | { ok: false; kind: "not_found" | "error"; message: string };

export async function loadSubjectDashboard(
  subjectId: string,
): Promise<SubjectDashboardLoadResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const displaySubjectIds = getTopicDisplaySubjectIds(subjectId);
    const fetchTopicsPlain = () =>
      supabase
        .from("topics")
        .select(
          "id, subject_id, name, display_order, question_count, knowledge_card, tracks",
        )
        .eq("is_inbox", false)
        .in("subject_id", displaySubjectIds)
        .order("display_order", { ascending: true });

    const fetchTopicsWithRef = () =>
      supabase
        .from("topics")
        .select(
          "id, subject_id, name, display_order, question_count, question_count_ref, knowledge_card, tracks",
        )
        .eq("is_inbox", false)
        .in("subject_id", displaySubjectIds)
        .order("display_order", { ascending: true });

    const subjectQuery = supabase
      .from("subjects")
      .select(
        "id, name, short_name, icon_name, year, track, product, display_order",
      )
      .eq("id", subjectId)
      .maybeSingle();

    const [subjectResult, topicsResult] = FEATURES.cemSource
      ? await (async () => {
          const subjectRes = await subjectQuery;
          const sourceUi = isSourceFilterLive(
            (subjectRes.data?.product as string | undefined) ?? null,
          );
          const topicsRes = sourceUi
            ? await fetchTopicsWithRef()
            : await fetchTopicsPlain();
          return [subjectRes, topicsRes] as const;
        })()
      : await Promise.all([subjectQuery, fetchTopicsPlain()]);

    const { data: subject, error: subjectError } = subjectResult;
    const { data: allTopicRows, error: topicsError } = topicsResult;

    if (subjectError) {
      console.error(
        "[loadSubjectDashboard] subjects:",
        subjectError.message,
        subjectError.code,
        subjectError.details,
      );
      return {
        ok: false,
        kind: "error",
        message: "Nie udało się wczytać przedmiotu. Spróbuj ponownie później.",
      };
    }

    if (!subject) {
      return {
        ok: false,
        kind: "not_found",
        message: "Nie znaleziono przedmiotu.",
      };
    }

    const subjectTrack = normalizeTrack(subject.track as string);
    if (isCatalogSubjectHidden(subjectId, subjectTrack)) {
      return {
        ok: false,
        kind: "not_found",
        message: "Nie znaleziono przedmiotu.",
      };
    }

    const canAccessSubject = await hasAccessForSubjectSelection(
      (subject.track as string) ?? "stomatologia",
      (subject.year as number) ?? 1,
      subject.product as string,
    );
    if (!canAccessSubject) {
      return {
        ok: false,
        kind: "error",
        message:
          "Ten rok jest zablokowany. Wybierz lub opłać dostęp w panelu wyboru roku.",
      };
    }

    const sourceUi =
      FEATURES.cemSource && isSourceFilterLive(subject.product as string);

    if (topicsError) {
      console.error(
        "[loadSubjectDashboard] topics:",
        topicsError.message,
        topicsError.code,
      );
      return {
        ok: false,
        kind: "error",
        message: "Nie udało się wczytać tematów. Spróbuj ponownie później.",
      };
    }

    const viewerTrack = normalizeTrack(subject.track as string) as StudyTrack;
    const trackedRows = filterTopicsForTrack(allTopicRows ?? [], viewerTrack);
    const topicRows = trackedRows.filter(
      (row) => !isVirtualThemeTopicId(row.id as string),
    );

    const allTopicIds = topicRows.map((t) => t.id as string);
    const contentTopicIds = (allTopicRows ?? [])
      .filter(
        (row) =>
          !isVirtualThemeTopicId(row.id as string) &&
          !isFinalExamTopicId(row.id as string),
      )
      .map((row) => row.id as string);
    const contentSubjectId = getCanonicalContentSubjectId(subjectId);
    const virtualDefinitions = mergeVirtualThemeDefinitions(
      contentSubjectId,
      trackedRows.map((row) => ({
        id: row.id as string,
        name: row.name as string | null,
        display_order: row.display_order as number | null,
      })),
    );
    const virtualQuestionIdsByTopic = new Map<string, string[]>();
    const virtualTopicMeta = new Map<
      string,
      { displayName: string; displayOrder: number; questionCount: number }
    >();

    for (const def of virtualDefinitions) {
      const themeRows = await fetchActiveQuestionsForThemeLabel(
        supabase,
        def.contentSubjectId,
        def.themeLabel,
        viewerTrack,
        contentTopicIds,
      );
      if (themeRows.length === 0) continue;
      const virtualId = buildVirtualThemeTopicId(
        def.contentSubjectId,
        def.themeLabel,
      );
      virtualQuestionIdsByTopic.set(
        virtualId,
        themeRows.map((row) => row.id),
      );
      virtualTopicMeta.set(virtualId, {
        displayName: def.displayName,
        displayOrder: def.displayOrder,
        questionCount: themeRows.length,
      });
    }
    const virtualTopicIds = [...virtualQuestionIdsByTopic.keys()];
    const sessionTopicIds = [...allTopicIds, ...virtualTopicIds];

    type TopicProgress = {
      uniqueAnswered: number;
      totalAttempts: number;
      totalCorrect: number;
    };
    const emptyProgress = (): TopicProgress => ({
      uniqueAnswered: 0,
      totalAttempts: 0,
      totalCorrect: 0,
    });
    const progressByTopic = new Map<string, TopicProgress>();
    const progressByTopicRef = new Map<string, TopicProgress>();
    const progressByTopicOwn = new Map<string, TopicProgress>();
    const topicSessionStats = new Map<string, { lastAt: string | null }>();
    const timesByQuestion = new Map<string, number>();
    const questionIdsByTopic = new Map<string, string[]>();
    const sourceByQuestionId = new Map<string, string>();
    const refSources = new Set<string>(
      sourceUi ? referenceSources(subject.product as string) : [],
    );
    let nextReviewDate: Date | null = null;
    let dueCount = 0;
    let nextReviewDateRef: Date | null = null;
    let dueCountRef = 0;
    let nextReviewDateOwn: Date | null = null;
    let dueCountOwn = 0;
    let protectedCemUnseen = 0;

    const visibleCountByTopic = new Map<string, number>();
    const nativeCountByTopic = new Map<string, number>();

    if (user && (allTopicIds.length > 0 || virtualTopicIds.length > 0)) {
      const memoryExperiment = await resolveMemoryEngineVariant(
        supabase,
        user.id,
      );
      let qRows: Awaited<ReturnType<typeof fetchActiveQuestionsForTopics>> = [];
      if (allTopicIds.length > 0) {
        qRows = await fetchActiveQuestionsForTopics(
          supabase,
          allTopicIds,
          viewerTrack,
          sourceUi
            ? {
                includeSource: true,
                includeReserveBucket: hasCemExams(subject.product as string),
              }
            : undefined,
        );
        for (const [tid, count] of countQuestionsByTopic(qRows)) {
          visibleCountByTopic.set(tid, count);
          nativeCountByTopic.set(tid, count);
        }
      }

      const yearQuestionIds = [
        ...new Set(Array.from(virtualQuestionIdsByTopic.values()).flat()),
      ];
      const finalExamTopicId = allTopicIds.find((id) => isFinalExamTopicId(id));
      if (finalExamTopicId) {
        const zalIds = qRows
          .filter((q) => q.topic_id === finalExamTopicId)
          .map((q) => q.id);
        visibleCountByTopic.set(
          finalExamTopicId,
          new Set([...zalIds, ...yearQuestionIds]).size,
        );
      }

      const qids = [...qRows.map((q) => q.id), ...yearQuestionIds];
      const uniqueQids = [...new Set(qids)];

      if (uniqueQids.length > 0) {
        const UQP_CHUNK = 200;
        type UqpRow = {
          question_id: string;
          times_answered: number | null;
          times_correct: number | null;
          next_review: string | null;
        };
        const uqpRows: UqpRow[] = [];
        for (let i = 0; i < uniqueQids.length; i += UQP_CHUNK) {
          const chunk = uniqueQids.slice(i, i + UQP_CHUNK);
          const { data, error: uqpErr } = await supabase
            .from("user_question_progress")
            .select("question_id, times_answered, times_correct, next_review")
            .eq("user_id", user.id)
            .in("question_id", chunk);
          if (uqpErr) {
            console.error("[loadSubjectDashboard] uqp:", uqpErr.message);
            break;
          }
          uqpRows.push(...((data ?? []) as UqpRow[]));
        }
        const memoryNextReview = new Map<string, string | null>();
        if (memoryExperiment.engineVariant === "treatment") {
          for (let i = 0; i < uniqueQids.length; i += UQP_CHUNK) {
            const chunk = uniqueQids.slice(i, i + UQP_CHUNK);
            const { data, error: memoryError } = await supabase
              .from("user_question_memory_v2")
              .select("question_id, next_review")
              .eq("user_id", user.id)
              .eq("scheduler_version", MEMORY_SCHEDULER_VERSION)
              .in("question_id", chunk);
            if (memoryError) {
              console.error(
                "[loadSubjectDashboard] memory v2:",
                memoryError.message,
              );
              break;
            }
            for (const row of data ?? []) {
              memoryNextReview.set(
                row.question_id as string,
                (row.next_review as string | null) ?? null,
              );
            }
          }
        }

        const questionToVirtualTopics = new Map<string, string[]>();
        for (const [virtualId, ids] of virtualQuestionIdsByTopic) {
          for (const qid of ids) {
            const linked = questionToVirtualTopics.get(qid) ?? [];
            linked.push(virtualId);
            questionToVirtualTopics.set(qid, linked);
          }
        }
        if (finalExamTopicId) {
          for (const qid of yearQuestionIds) {
            const linked = questionToVirtualTopics.get(qid) ?? [];
            if (!linked.includes(finalExamTopicId))
              linked.push(finalExamTopicId);
            questionToVirtualTopics.set(qid, linked);
          }
        }

        for (const q of qRows) {
          const tid = q.topic_id;
          if (!tid) continue;
          const list = questionIdsByTopic.get(tid) ?? [];
          list.push(q.id);
          questionIdsByTopic.set(tid, list);
          if (sourceUi && q.source) sourceByQuestionId.set(q.id, q.source);
        }
        for (const [virtualId, ids] of virtualQuestionIdsByTopic) {
          questionIdsByTopic.set(virtualId, ids);
        }
        if (finalExamTopicId) {
          const zalIds = qRows
            .filter((q) => q.topic_id === finalExamTopicId)
            .map((q) => q.id);
          questionIdsByTopic.set(finalExamTopicId, [
            ...new Set([...zalIds, ...yearQuestionIds]),
          ]);
        }

        const now = new Date();
        for (const r of uqpRows) {
          const tid = qRows.find((q) => q.id === r.question_id)?.topic_id;
          const timesAns = Number(r.times_answered ?? 0);
          const timesCorr = Number(r.times_correct ?? 0);
          timesByQuestion.set(r.question_id, timesAns);

          const applyProgress = (
            map: Map<string, TopicProgress>,
            topicKey: string,
          ) => {
            const cur = map.get(topicKey) ?? emptyProgress();
            if (timesAns > 0) cur.uniqueAnswered += 1;
            cur.totalAttempts += timesAns;
            cur.totalCorrect += timesCorr;
            map.set(topicKey, cur);
          };

          const qSource = sourceByQuestionId.get(r.question_id);
          const sourceBucket: "reference" | "own" | null =
            qSource === "own"
              ? "own"
              : qSource && refSources.has(qSource)
                ? "reference"
                : null;
          const sourceMap =
            sourceBucket === "reference"
              ? progressByTopicRef
              : sourceBucket === "own"
                ? progressByTopicOwn
                : null;

          if (tid) {
            applyProgress(progressByTopic, tid);
            if (sourceMap) applyProgress(sourceMap, tid);
          }
          for (const virtualId of questionToVirtualTopics.get(r.question_id) ??
            []) {
            applyProgress(progressByTopic, virtualId);
            if (sourceMap) applyProgress(sourceMap, virtualId);
          }

          // Due = next_review <= now (jak RPC due_review_count / karty przedmiotów)
          const nr = memoryNextReview.has(r.question_id)
            ? (memoryNextReview.get(r.question_id) ?? null)
            : (r.next_review as string | null);
          if (nr) {
            const nrDate = new Date(nr);
            if (!nextReviewDate || nrDate < nextReviewDate)
              nextReviewDate = nrDate;
            if (nrDate <= now) dueCount += 1;
            if (sourceBucket === "reference") {
              if (!nextReviewDateRef || nrDate < nextReviewDateRef) {
                nextReviewDateRef = nrDate;
              }
              if (nrDate <= now) dueCountRef += 1;
            } else if (sourceBucket === "own") {
              if (!nextReviewDateOwn || nrDate < nextReviewDateOwn) {
                nextReviewDateOwn = nrDate;
              }
              if (nrDate <= now) dueCountOwn += 1;
            }
          }
        }
      }

      if (sourceUi && hasCemExams(subject.product as string)) {
        for (const q of qRows) {
          if (q.source !== "cem") continue;
          if ((q.reserve_bucket ?? 0) < CEM_RESERVE_BUCKET_MIN) continue;
          if ((timesByQuestion.get(q.id) ?? 0) > 0) continue;
          protectedCemUnseen += 1;
        }
      }

      if (sessionTopicIds.length > 0) {
        const { data: topicSessions, error: topicSessErr } = await supabase
          .from("study_sessions")
          .select("topic_id, completed_at")
          .eq("user_id", user.id)
          .eq("is_completed", true)
          .in("topic_id", sessionTopicIds)
          .order("completed_at", { ascending: false });

        if (topicSessErr) {
          console.error(
            "[loadSubjectDashboard] topic sessions:",
            topicSessErr.message,
          );
        } else {
          for (const r of topicSessions ?? []) {
            const tid = r.topic_id as string | null;
            if (!tid) continue;
            const cur = topicSessionStats.get(tid) ?? { lastAt: null };
            if (!cur.lastAt) cur.lastAt = (r.completed_at as string) ?? null;
            topicSessionStats.set(tid, cur);
          }
        }
      }
    }

    const fullPassCount = (topicId: string): number => {
      const ids = questionIdsByTopic.get(topicId) ?? [];
      if (ids.length === 0) return 0;
      let min = Infinity;
      for (const id of ids) {
        min = Math.min(min, timesByQuestion.get(id) ?? 0);
      }
      return Number.isFinite(min) ? min : 0;
    };

    const topics: TopicWithProgress[] = topicRows
      .map((row) => {
        const prog = progressByTopic.get(row.id as string);
        const sess = topicSessionStats.get(row.id as string);
        const liveCount = visibleCountByTopic.get(row.id as string);
        const refCount = sourceUi
          ? Number(
              (row as { question_count_ref?: number | null })
                .question_count_ref ?? 0,
            )
          : null;
        return {
          id: row.id,
          subject_id: subjectId,
          name: row.name,
          display_order: row.display_order ?? 0,
          question_count: liveCount ?? Number(row.question_count ?? 0),
          answered_count: prog?.uniqueAnswered ?? 0,
          correct_count: prog?.totalCorrect ?? 0,
          knowledge_card: (row.knowledge_card as string | null) ?? null,
          session_count: fullPassCount(row.id as string),
          last_studied_at: sess?.lastAt ?? null,
          ...(sourceUi
            ? {
                question_count_ref: refCount,
                answered_count_ref:
                  progressByTopicRef.get(row.id as string)?.uniqueAnswered ?? 0,
                answered_count_own:
                  progressByTopicOwn.get(row.id as string)?.uniqueAnswered ?? 0,
              }
            : {}),
        };
      })
      .concat(
        virtualTopicIds.map((virtualId) => {
          const meta = virtualTopicMeta.get(virtualId)!;
          const prog = progressByTopic.get(virtualId);
          const sess = topicSessionStats.get(virtualId);
          return {
            id: virtualId,
            subject_id: subjectId,
            name: meta.displayName,
            display_order: meta.displayOrder,
            question_count: meta.questionCount,
            answered_count: prog?.uniqueAnswered ?? 0,
            correct_count: prog?.totalCorrect ?? 0,
            knowledge_card: null,
            session_count: fullPassCount(virtualId),
            last_studied_at: sess?.lastAt ?? null,
          };
        }),
      )
      .sort((a, b) => a.display_order - b.display_order);

    let totalQuestions = 0;
    let answeredQuestions = 0;
    let totalAttempts = 0;
    let totalCorrect = 0;
    for (const t of topics) {
      if (isVirtualThemeTopicId(t.id)) continue;
      totalQuestions += isFinalExamTopicId(t.id)
        ? (nativeCountByTopic.get(t.id) ?? 0)
        : t.question_count;
      answeredQuestions += t.answered_count;
    }
    for (const tid of allTopicIds) {
      const p = progressByTopic.get(tid);
      if (!p) continue;
      totalAttempts += p.totalAttempts;
      totalCorrect += p.totalCorrect;
    }
    const stats = buildSubjectStats({
      totalQuestions,
      answeredQuestions,
      totalAttempts,
      totalCorrect,
      nextReviewDate,
      dueCount,
    });

    let sourceCounts: SourceFilterCounts | null = null;
    let statsBySource: Record<
      "all" | "reference" | "own",
      SubjectStats
    > | null = null;
    let sourceAccuracy: SourceAccuracyBreakdown | null = null;
    if (sourceUi) {
      let all = 0;
      let ref = 0;
      let answeredRef = 0;
      let answeredOwn = 0;
      for (const t of topics) {
        if (isVirtualThemeTopicId(t.id) || isFinalExamTopicId(t.id)) continue;
        all += t.question_count;
        ref += t.question_count_ref ?? 0;
        answeredRef += t.answered_count_ref ?? 0;
        answeredOwn += t.answered_count_own ?? 0;
      }
      sourceCounts = sourceCountsFromTotals(all, ref);

      let attemptsRef = 0;
      let correctRef = 0;
      let attemptsOwn = 0;
      let correctOwn = 0;
      for (const tid of allTopicIds) {
        const pr = progressByTopicRef.get(tid);
        if (pr) {
          attemptsRef += pr.totalAttempts;
          correctRef += pr.totalCorrect;
        }
        const po = progressByTopicOwn.get(tid);
        if (po) {
          attemptsOwn += po.totalAttempts;
          correctOwn += po.totalCorrect;
        }
      }

      statsBySource = {
        all: stats,
        reference: buildSubjectStats({
          totalQuestions: sourceCounts.reference,
          answeredQuestions: answeredRef,
          totalAttempts: attemptsRef,
          totalCorrect: correctRef,
          nextReviewDate: nextReviewDateRef,
          dueCount: dueCountRef,
        }),
        own: buildSubjectStats({
          totalQuestions: sourceCounts.own,
          answeredQuestions: answeredOwn,
          totalAttempts: attemptsOwn,
          totalCorrect: correctOwn,
          nextReviewDate: nextReviewDateOwn,
          dueCount: dueCountOwn,
        }),
      };

      sourceAccuracy = {
        product: subject.product as string,
        reference: {
          total: sourceCounts.reference,
          seen: answeredRef,
          correct: correctRef,
        },
        own: {
          total: sourceCounts.own,
          seen: answeredOwn,
          correct: correctOwn,
        },
        protectedCount: hasCemExams(subject.product as string)
          ? protectedCemUnseen
          : 0,
      };
    }

    return {
      ok: true,
      subject: subject as Subject,
      topics,
      stats,
      sourceCounts,
      statsBySource,
      sourceAccuracy,
    };
  } catch (e) {
    console.error("[loadSubjectDashboard] unexpected:", e);
    return {
      ok: false,
      kind: "error",
      message:
        "Wystąpił nieoczekiwany błąd. Odśwież stronę lub spróbuj później.",
    };
  }
}

function buildSubjectStats(input: {
  totalQuestions: number;
  answeredQuestions: number;
  totalAttempts: number;
  totalCorrect: number;
  nextReviewDate: Date | null;
  dueCount: number;
}): SubjectStats {
  const accuracy =
    input.totalAttempts > 0 ? input.totalCorrect / input.totalAttempts : 0;
  const masteryPct =
    input.totalQuestions > 0
      ? Math.round(
          (input.answeredQuestions > 0 ? accuracy : 0) *
            Math.min(1, input.answeredQuestions / input.totalQuestions) *
            100,
        )
      : 0;
  return {
    totalQuestions: input.totalQuestions,
    answeredQuestions: input.answeredQuestions,
    correctAnswers: input.totalCorrect,
    accuracy,
    masteryPct,
    nextReviewDate: input.nextReviewDate?.toISOString() ?? null,
    dueCount: input.dueCount,
  };
}
