import { createClient } from "@/lib/supabase/server";
import type { Subject, Topic } from "@/features/subjects/types";

export type SubjectDashboardLoadResult =
  | { ok: true; subject: Subject; topics: Topic[] }
  | { ok: false; kind: "not_found" | "error"; message: string };

export async function loadSubjectDashboard(
  subjectId: string,
): Promise<SubjectDashboardLoadResult> {
  try {
    const supabase = await createClient();

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

    const topics: Topic[] = (topicRows ?? []).map((row) => ({
      id: row.id,
      subject_id: row.subject_id,
      name: row.name,
      display_order: row.display_order ?? 0,
      question_count: row.question_count ?? 0,
    }));

    return { ok: true, subject: subject as Subject, topics };
  } catch (e) {
    console.error("[loadSubjectDashboard] unexpected:", e);
    return {
      ok: false,
      kind: "error",
      message: "Wystąpił nieoczekiwany błąd. Odśwież stronę lub spróbuj później.",
    };
  }
}
