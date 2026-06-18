import { createClient } from "@/lib/supabase/server";
import type { Subject, Topic } from "@/features/subjects/types";
import { hasAccessForSubjectSelection } from "@/features/access/server/guards";
import { normalizeTrack, type StudyTrack } from "@/features/access/lib/studyAccess";
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
  getVirtualThemeTopicsForContentSubject,
  isVirtualThemeTopicId,
} from "@/lib/content/virtualThemeTopics";

export type TopicWithProgress = Topic & {
  answered_count: number;
  correct_count: number;
  knowledge_card: string | null;
  /** Ukończone sesje z tego tematu (kafelek / filtr topic_id). */
  session_count: number;
  last_studied_at: string | null;
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
  | { ok: true; subject: Subject; topics: TopicWithProgress[]; stats: SubjectStats }
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
    const [subjectResult, topicsResult] = await Promise.all([
      supabase
        .from("subjects")
        .select(
          "id, name, short_name, icon_name, year, track, product, display_order",
        )
        .eq("id", subjectId)
        .maybeSingle(),
      supabase
        .from("topics")
        .select(
          "id, subject_id, name, display_order, question_count, knowledge_card, tracks",
        )
        .in("subject_id", displaySubjectIds)
        .order("display_order", { ascending: true }),
    ]);

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
    );
    if (!canAccessSubject) {
      return {
        ok: false,
        kind: "error",
        message: "Ten rok jest zablokowany. Wybierz lub opłać dostęp w panelu wyboru roku.",
      };
    }

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
    const topicRows = filterTopicsForTrack(allTopicRows ?? [], viewerTrack);

    const allTopicIds = topicRows.map((t) => t.id as string);
    const contentSubjectId = getCanonicalContentSubjectId(subjectId);
    const virtualDefinitions = getVirtualThemeTopicsForContentSubject(contentSubjectId);
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

    const progressByTopic = new Map<
      string,
      { uniqueAnswered: number; totalAttempts: number; totalCorrect: number }
    >();
    const topicSessionStats = new Map<
      string,
      { count: number; lastAt: string | null }
    >();
    let nextReviewDate: Date | null = null;
    let dueCount = 0;

    const visibleCountByTopic = new Map<string, number>();

    if (user && (allTopicIds.length > 0 || virtualTopicIds.length > 0)) {
      let qRows: Awaited<ReturnType<typeof fetchActiveQuestionsForTopics>> = [];
      if (allTopicIds.length > 0) {
        qRows = await fetchActiveQuestionsForTopics(
          supabase,
          allTopicIds,
          viewerTrack,
        );
        for (const [tid, count] of countQuestionsByTopic(qRows)) {
          visibleCountByTopic.set(tid, count);
        }
      }

      const qids = [
        ...qRows.map((q) => q.id),
        ...Array.from(virtualQuestionIdsByTopic.values()).flat(),
      ];
      const uniqueQids = [...new Set(qids)];

      if (uniqueQids.length > 0) {
        const UQP_CHUNK = 200;
        type UqpRow = {
          question_id: string;
          times_answered: number | null;
          times_correct: number | null;
          next_review: string | null;
          state: string | null;
        };
        const uqpRows: UqpRow[] = [];
        for (let i = 0; i < uniqueQids.length; i += UQP_CHUNK) {
          const chunk = uniqueQids.slice(i, i + UQP_CHUNK);
          const { data, error: uqpErr } = await supabase
            .from("user_question_progress")
            .select("question_id, times_answered, times_correct, next_review, state")
            .eq("user_id", user.id)
            .in("question_id", chunk);
          if (uqpErr) {
            console.error("[loadSubjectDashboard] uqp:", uqpErr.message);
            break;
          }
          uqpRows.push(...((data ?? []) as UqpRow[]));
        }

        const questionToVirtualTopics = new Map<string, string[]>();
        for (const [virtualId, ids] of virtualQuestionIdsByTopic) {
          for (const qid of ids) {
            const linked = questionToVirtualTopics.get(qid) ?? [];
            linked.push(virtualId);
            questionToVirtualTopics.set(qid, linked);
          }
        }

        const now = new Date();
        for (const r of uqpRows) {
          const tid = qRows.find((q) => q.id === r.question_id)?.topic_id;
          const timesAns = Number(r.times_answered ?? 0);
          const timesCorr = Number(r.times_correct ?? 0);

          const applyProgress = (topicKey: string) => {
            const cur = progressByTopic.get(topicKey) ?? {
              uniqueAnswered: 0,
              totalAttempts: 0,
              totalCorrect: 0,
            };
            if (timesAns > 0) cur.uniqueAnswered += 1;
            cur.totalAttempts += timesAns;
            cur.totalCorrect += timesCorr;
            progressByTopic.set(topicKey, cur);
          };

          if (tid) applyProgress(tid);
          for (const virtualId of questionToVirtualTopics.get(r.question_id) ?? []) {
            applyProgress(virtualId);
          }

          const st = r.state as string | null;
          const nr = r.next_review as string | null;
          if (nr && (st === "review" || st === "relearning")) {
            const nrDate = new Date(nr);
            if (!nextReviewDate || nrDate < nextReviewDate) nextReviewDate = nrDate;
            if (nrDate <= now) dueCount += 1;
          }
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
          console.error("[loadSubjectDashboard] topic sessions:", topicSessErr.message);
        } else {
          for (const r of topicSessions ?? []) {
            const tid = r.topic_id as string | null;
            if (!tid) continue;
            const cur = topicSessionStats.get(tid) ?? { count: 0, lastAt: null };
            cur.count += 1;
            if (!cur.lastAt) cur.lastAt = (r.completed_at as string) ?? null;
            topicSessionStats.set(tid, cur);
          }
        }
      }
    }

    const topics: TopicWithProgress[] = topicRows
      .map((row) => {
        const prog = progressByTopic.get(row.id as string);
        const sess = topicSessionStats.get(row.id as string);
        return {
          id: row.id,
          subject_id: subjectId,
          name: row.name,
          display_order: row.display_order ?? 0,
          question_count: visibleCountByTopic.get(row.id as string) ?? 0,
          answered_count: prog?.uniqueAnswered ?? 0,
          correct_count: prog?.totalCorrect ?? 0,
          knowledge_card: (row.knowledge_card as string | null) ?? null,
          session_count: sess?.count ?? 0,
          last_studied_at: sess?.lastAt ?? null,
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
            session_count: sess?.count ?? 0,
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
      totalQuestions += t.question_count;
      answeredQuestions += t.answered_count;
    }
    for (const tid of allTopicIds) {
      const p = progressByTopic.get(tid);
      if (!p) continue;
      totalAttempts += p.totalAttempts;
      totalCorrect += p.totalCorrect;
    }
    const correctAnswers = totalCorrect;
    const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
    const masteryPct = totalQuestions > 0
      ? Math.round((answeredQuestions > 0 ? accuracy : 0) * (Math.min(1, answeredQuestions / totalQuestions)) * 100)
      : 0;

    return {
      ok: true,
      subject: subject as Subject,
      topics,
      stats: {
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        accuracy,
        masteryPct,
        nextReviewDate: nextReviewDate?.toISOString() ?? null,
        dueCount,
      },
    };
  } catch (e) {
    console.error("[loadSubjectDashboard] unexpected:", e);
    return {
      ok: false,
      kind: "error",
      message: "Wystąpił nieoczekiwany błąd. Odśwież stronę lub spróbuj później.",
    };
  }
}
