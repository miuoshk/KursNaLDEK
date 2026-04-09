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

    // Fetch per-topic user progress in one query
    const progressByTopic = new Map<string, { answered: number; correct: number }>();
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
          .select("question_id, times_answered, times_correct")
          .eq("user_id", user.id)
          .in("question_id", qids);

        for (const r of uqpRows ?? []) {
          const tid = topicByQ.get(r.question_id as string);
          if (!tid) continue;
          const cur = progressByTopic.get(tid) ?? { answered: 0, correct: 0 };
          cur.answered += Number(r.times_answered ?? 0);
          cur.correct += Number(r.times_correct ?? 0);
          progressByTopic.set(tid, cur);
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
        answered_count: prog?.answered ?? 0,
        correct_count: prog?.correct ?? 0,
      };
    });

    let totalQuestions = 0;
    let answeredQuestions = 0;
    let correctAnswers = 0;
    for (const t of topics) {
      totalQuestions += t.question_count;
      answeredQuestions += t.answered_count;
      correctAnswers += t.correct_count;
    }
    const accuracy = answeredQuestions > 0 ? correctAnswers / answeredQuestions : 0;
    const masteryPct = totalQuestions > 0
      ? Math.round((answeredQuestions > 0 ? accuracy : 0) * (Math.min(1, answeredQuestions / totalQuestions)) * 100)
      : 0;

    return {
      ok: true,
      subject: subject as Subject,
      topics,
      stats: { totalQuestions, answeredQuestions, correctAnswers, accuracy, masteryPct },
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
