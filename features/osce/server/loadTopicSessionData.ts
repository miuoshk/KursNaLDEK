import { mapRecordToTopicSessionQuestionRow } from "@/features/osce/server/mapTopicQuestionRow";
import { OSCE_QUESTIONS_COLUMNS } from "@/features/osce/server/osceQuestionsSelect";
import { createClient } from "@/lib/supabase/server";
import type { TopicSessionQuestionRow } from "@/features/osce/types";

export type LoadTopicSessionDataResult =
  | {
      ok: true;
      topicId: string;
      topicName: string;
      knowledgeCard: string | null;
      subjectId: string;
      questions: TopicSessionQuestionRow[];
    }
  | { ok: false; kind: "not_found" | "error"; message: string };


export async function loadTopicSessionData(
  stationId: string,
  topicId: string,
): Promise<LoadTopicSessionDataResult> {
  try {
    const supabase = await createClient();

    const [topicRes, questionsRes] = await Promise.all([
      supabase
        .from("topics")
        .select("id, name, subject_id, knowledge_card")
        .eq("id", topicId)
        .eq("subject_id", stationId)
        .maybeSingle(),
      supabase
        .from("questions")
        .select(OSCE_QUESTIONS_COLUMNS)
        .eq("topic_id", topicId)
        .eq("is_active", true),
    ]);

    const { data: topic, error: topicErr } = topicRes;
    const { data: qRows, error: qErr } = questionsRes;

    if (topicErr) {
      console.error("[loadTopicSessionData] topic:", topicErr.message);
      return {
        ok: false,
        kind: "error",
        message: "Nie udało się wczytać tematu.",
      };
    }

    if (!topic) {
      return { ok: false, kind: "not_found", message: "Nie znaleziono tematu." };
    }

    if (qErr) {
      console.error("[loadTopicSessionData] questions:", qErr.message);
      return {
        ok: false,
        kind: "error",
        message: "Nie udało się wczytać pytań.",
      };
    }

    const rows = (qRows ?? []).map((r) =>
      mapRecordToTopicSessionQuestionRow(r as Record<string, unknown>),
    );
    const sorted = [...rows].sort((a, b) => a.id.localeCompare(b.id));

    return {
      ok: true,
      topicId: topic.id as string,
      topicName: topic.name as string,
      knowledgeCard: (topic.knowledge_card as string | null) ?? null,
      subjectId: topic.subject_id as string,
      questions: sorted,
    };
  } catch (e) {
    console.error("[loadTopicSessionData]", e);
    return {
      ok: false,
      kind: "error",
      message: "Wystąpił nieoczekiwany błąd.",
    };
  }
}
