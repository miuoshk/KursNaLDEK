import { createClient } from "@/lib/supabase/server";
import type { Subject, Topic } from "@/features/subjects/types";
import { hasAccessForSubjectSelection } from "@/features/access/server/guards";
import {
  getSubjectScopeIds,
  getTopicFamilyKey,
} from "@/features/session/server/sharedSubjects";

export type TopicWithProgress = Topic & {
  answered_count: number;
  correct_count: number;
  knowledge_card: string | null;
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

    const scopeSubjectIds = getSubjectScopeIds(subjectId);
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
        .select("id, subject_id, name, display_order, question_count, knowledge_card")
        .in("subject_id", scopeSubjectIds)
        .order("display_order", { ascending: true }),
    ]);

    const { data: subject, error: subjectError } = subjectResult;
    const { data: allTopicRows, error: topicsError } = topicsResult;
    // Native topiki to topiki należące do bieżącego subjectu; peer topiki
    // (drugi kierunek dla anatomii) służą tylko do agregacji pul pytań.
    const topicRows = (allTopicRows ?? []).filter((row) => row.subject_id === subjectId);
    const peerTopicRows = (allTopicRows ?? []).filter((row) => row.subject_id !== subjectId);

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

    const allTopicIds = (allTopicRows ?? []).map((t) => t.id as string);
    // Peer-topiki (drugi kierunek) wpadają do tej samej "rodziny" co topic
    // native — wszystkie ich pytania i postęp dolicza się do native topica,
    // żeby UI lekarski/stoma widzieli ten sam pool.
    const familyToNativeTopicId = new Map<string, string>();
    for (const row of topicRows) {
      familyToNativeTopicId.set(getTopicFamilyKey(row.id as string), row.id as string);
    }
    const peerSubjectQuestionCountByNativeTopic = new Map<string, number>();
    for (const row of peerTopicRows) {
      const native = familyToNativeTopicId.get(getTopicFamilyKey(row.id as string));
      if (!native) continue;
      peerSubjectQuestionCountByNativeTopic.set(
        native,
        (peerSubjectQuestionCountByNativeTopic.get(native) ?? 0) +
          Number(row.question_count ?? 0),
      );
    }

    const progressByTopic = new Map<
      string,
      { uniqueAnswered: number; totalAttempts: number; totalCorrect: number }
    >();
    let nextReviewDate: Date | null = null;
    let dueCount = 0;

    if (user && allTopicIds.length > 0) {
      const { data: qRows } = await supabase
        .from("questions")
        .select("id, topic_id")
        .in("topic_id", allTopicIds)
        .eq("is_active", true);

      const qids = (qRows ?? []).map((q) => q.id as string);
      // Mapowanie question_id -> native_topic_id (peer-topic question też
      // trafia do native topica, żeby postęp był liczony zbiorczo).
      const nativeTopicByQ = new Map<string, string>();
      for (const q of qRows ?? []) {
        const tid = q.topic_id as string;
        const native = familyToNativeTopicId.get(getTopicFamilyKey(tid));
        if (native) nativeTopicByQ.set(q.id as string, native);
      }

      if (qids.length > 0) {
        const { data: uqpRows } = await supabase
          .from("user_question_progress")
          .select("question_id, times_answered, times_correct, next_review, state")
          .eq("user_id", user.id)
          .in("question_id", qids);

        const now = new Date();
        for (const r of uqpRows ?? []) {
          const tid = nativeTopicByQ.get(r.question_id as string);
          if (!tid) continue;
          const timesAns = Number(r.times_answered ?? 0);
          const timesCorr = Number(r.times_correct ?? 0);
          const cur = progressByTopic.get(tid) ?? {
            uniqueAnswered: 0,
            totalAttempts: 0,
            totalCorrect: 0,
          };
          if (timesAns > 0) cur.uniqueAnswered += 1;
          cur.totalAttempts += timesAns;
          cur.totalCorrect += timesCorr;
          progressByTopic.set(tid, cur);

          const st = r.state as string | null;
          const nr = r.next_review as string | null;
          if (nr && (st === "review" || st === "relearning")) {
            const nrDate = new Date(nr);
            if (!nextReviewDate || nrDate < nextReviewDate) nextReviewDate = nrDate;
            if (nrDate <= now) dueCount += 1;
          }
        }
      }
    }

    const topics: TopicWithProgress[] = topicRows.map((row) => {
      const prog = progressByTopic.get(row.id as string);
      const nativeCount = Number(row.question_count ?? 0);
      const peerCount = peerSubjectQuestionCountByNativeTopic.get(row.id as string) ?? 0;
      return {
        id: row.id,
        subject_id: row.subject_id,
        name: row.name,
        display_order: row.display_order ?? 0,
        question_count: nativeCount + peerCount,
        answered_count: prog?.uniqueAnswered ?? 0,
        correct_count: prog?.totalCorrect ?? 0,
        knowledge_card: (row.knowledge_card as string | null) ?? null,
      };
    });

    let totalQuestions = 0;
    let answeredQuestions = 0;
    let totalAttempts = 0;
    let totalCorrect = 0;
    for (const t of topics) {
      totalQuestions += t.question_count;
      answeredQuestions += t.answered_count;
    }
    for (const p of progressByTopic.values()) {
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
