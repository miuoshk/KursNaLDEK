import { createClient } from "@/lib/supabase/server";
import type { Subject, Topic } from "@/features/subjects/types";

export type TopicWithProgress = Topic & {
  answered_count: number;
  correct_count: number;
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
        .select("id, subject_id, name, display_order, question_count")
        .eq("subject_id", subjectId)
        .order("display_order", { ascending: true }),
    ]);

    const { data: subject, error: subjectError } = subjectResult;
    const { data: topicRows, error: topicsError } = topicsResult;

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

    const topicIds = (topicRows ?? []).map((t) => t.id as string);

    const progressByTopic = new Map<
      string,
      { uniqueAnswered: number; totalAttempts: number; totalCorrect: number }
    >();
    let nextReviewDate: Date | null = null;
    let dueCount = 0;

    if (user && topicIds.length > 0) {
      const { data: qRows } = await supabase
        .from("questions")
        .select("id, topic_id")
        .in("topic_id", topicIds)
        .eq("is_active", true);

      const qids = (qRows ?? []).map((q) => q.id as string);
      const topicByQ = new Map(
        (qRows ?? []).map((q) => [q.id as string, q.topic_id as string]),
      );

      if (qids.length > 0) {
        const { data: uqpRows } = await supabase
          .from("user_question_progress")
          .select("question_id, times_answered, times_correct, next_review, state")
          .eq("user_id", user.id)
          .in("question_id", qids);

        const now = new Date();
        for (const r of uqpRows ?? []) {
          const tid = topicByQ.get(r.question_id as string);
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

    const topics: TopicWithProgress[] = (topicRows ?? []).map((row) => {
      const prog = progressByTopic.get(row.id as string);
      return {
        id: row.id,
        subject_id: row.subject_id,
        name: row.name,
        display_order: row.display_order ?? 0,
        question_count: row.question_count ?? 0,
        answered_count: prog?.uniqueAnswered ?? 0,
        correct_count: prog?.totalCorrect ?? 0,
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
