import { createClient } from "@/lib/supabase/server";
import type { OsceStation, OsceTopic } from "@/features/osce/types";

export type LoadOsceStationResult =
  | { ok: true; station: OsceStation; topics: OsceTopic[] }
  | { ok: false; kind: "not_found" | "error"; message: string };

export async function loadOsceStation(stationId: string): Promise<LoadOsceStationResult> {
  try {
    const supabase = await createClient();

    const [subjectResult, topicsResult] = await Promise.all([
      supabase
        .from("subjects")
        .select(
          "id, name, short_name, display_order, exam_day, exam_tasks, product",
        )
        .eq("id", stationId)
        .eq("product", "osce")
        .maybeSingle(),
      supabase
        .from("topics")
        .select("id, subject_id, name, display_order, question_count")
        .eq("subject_id", stationId)
        .order("display_order", { ascending: true }),
    ]);

    const { data: subject, error: subjectError } = subjectResult;
    const { data: topicRows, error: topicsError } = topicsResult;

    if (subjectError) {
      console.error("[loadOsceStation] subjects:", subjectError.message);
      return {
        ok: false,
        kind: "error",
        message: "Nie udało się wczytać stacji. Spróbuj ponownie później.",
      };
    }

    if (!subject) {
      return {
        ok: false,
        kind: "not_found",
        message: "Nie znaleziono stacji.",
      };
    }

    if (topicsError) {
      console.error("[loadOsceStation] topics:", topicsError.message);
      return {
        ok: false,
        kind: "error",
        message: "Nie udało się wczytać tematów. Spróbuj ponownie później.",
      };
    }

    const station: OsceStation = {
      id: subject.id as string,
      name: subject.name as string,
      short_name: subject.short_name as string,
      display_order: (subject.display_order as number) ?? 0,
      exam_day: (subject.exam_day as number | null) ?? null,
      exam_tasks: (subject.exam_tasks as string | null) ?? null,
    };

    const topics: OsceTopic[] = (topicRows ?? []).map((row) => ({
      id: row.id as string,
      subject_id: row.subject_id as string,
      name: row.name as string,
      display_order: row.display_order ?? 0,
      question_count: row.question_count ?? 0,
    }));

    return { ok: true, station, topics };
  } catch (e) {
    console.error("[loadOsceStation] unexpected:", e);
    return {
      ok: false,
      kind: "error",
      message: "Wystąpił nieoczekiwany błąd. Odśwież stronę lub spróbuj później.",
    };
  }
}
