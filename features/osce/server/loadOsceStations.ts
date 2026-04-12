import { normalizeExamTasks } from "@/features/osce/lib/normalizeExamTasks";
import { createClient } from "@/lib/supabase/server";
import type { OsceStation } from "@/features/osce/types";

export type LoadOsceStationsResult =
  | { ok: true; stations: OsceStation[]; examDate: string | null }
  | { ok: false; message: string };

export async function loadOsceStations(): Promise<LoadOsceStationsResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, message: "Brak aktywnej sesji. Zaloguj się ponownie." };
    }

    const [{ data, error }, { data: profile }] = await Promise.all([
      supabase
        .from("subjects")
        .select(
          "id, name, short_name, display_order, exam_day, exam_tasks, competencies, pass_threshold, exam_info, product",
        )
        .eq("product", "osce")
        .order("display_order", { ascending: true }),
      supabase.from("profiles").select("exam_date").eq("id", user.id).maybeSingle(),
    ]);

    if (error) {
      console.error("[loadOsceStations]", error.message, error.code, error.details);
      return {
        ok: false,
        message: "Nie udało się wczytać stacji OSCE. Spróbuj ponownie później.",
      };
    }

    const subjectIds = (data ?? []).map((row) => row.id as string);
    const totalQuestionCountByStation = new Map<string, number>();
    const answeredQuestionsByStation = new Map<string, Set<string>>();

    if (subjectIds.length > 0) {
      const { data: topicRows } = await supabase
        .from("topics")
        .select("id, subject_id, question_count")
        .in("subject_id", subjectIds);

      const topicToSubject = new Map<string, string>();
      const topicIds: string[] = [];
      for (const topic of topicRows ?? []) {
        const topicId = topic.id as string;
        const subjectId = topic.subject_id as string;
        topicIds.push(topicId);
        topicToSubject.set(topicId, subjectId);
        totalQuestionCountByStation.set(
          subjectId,
          (totalQuestionCountByStation.get(subjectId) ?? 0) + Number(topic.question_count ?? 0),
        );
      }

      if (topicIds.length > 0) {
        const { data: questionRows } = await supabase
          .from("questions")
          .select("id, topic_id")
          .in("topic_id", topicIds)
          .eq("is_active", true);

        const questionIds: string[] = [];
        const questionToSubject = new Map<string, string>();
        for (const question of questionRows ?? []) {
          const questionId = question.id as string;
          const subjectId = topicToSubject.get(question.topic_id as string);
          if (!subjectId) continue;
          questionIds.push(questionId);
          questionToSubject.set(questionId, subjectId);
        }

        if (questionIds.length > 0) {
          const { data: progressRows } = await supabase
            .from("user_question_progress")
            .select("question_id, times_answered")
            .eq("user_id", user.id)
            .in("question_id", questionIds);

          for (const row of progressRows ?? []) {
            if (Number(row.times_answered ?? 0) <= 0) continue;
            const questionId = row.question_id as string;
            const subjectId = questionToSubject.get(questionId);
            if (!subjectId) continue;
            if (!answeredQuestionsByStation.has(subjectId)) {
              answeredQuestionsByStation.set(subjectId, new Set());
            }
            answeredQuestionsByStation.get(subjectId)?.add(questionId);
          }
        }
      }
    }

    const stations: OsceStation[] = (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      short_name: row.short_name as string,
      display_order: (row.display_order as number) ?? 0,
      exam_day: (row.exam_day as number | null) ?? null,
      exam_tasks: normalizeExamTasks(row.exam_tasks),
      competencies: (row.competencies as OsceStation["competencies"]) ?? null,
      pass_threshold: (row.pass_threshold as number | null) ?? null,
      exam_info: (row.exam_info as OsceStation["exam_info"]) ?? null,
      question_count: totalQuestionCountByStation.get(row.id as string) ?? 0,
      answered_questions: answeredQuestionsByStation.get(row.id as string)?.size ?? 0,
    }));

    const examDate = (profile?.exam_date as string | null | undefined) ?? null;
    return { ok: true, stations, examDate };
  } catch (e) {
    console.error("[loadOsceStations] unexpected", e);
    return {
      ok: false,
      message: "Wystąpił nieoczekiwany błąd. Odśwież stronę lub spróbuj później.",
    };
  }
}
