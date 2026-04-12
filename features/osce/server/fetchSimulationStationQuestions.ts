"use server";

import {
  OSCE_QUESTIONS_PER_TOPIC,
  OSCE_TOPICS_PER_STATION,
} from "@/features/osce/constants/osceSimulation";
import { mapRecordToTopicSessionQuestionRow } from "@/features/osce/server/mapTopicQuestionRow";
import { OSCE_QUESTIONS_COLUMNS } from "@/features/osce/server/osceQuestionsSelect";
import type { TopicSessionQuestionRow } from "@/features/osce/types";
import { createClient } from "@/lib/supabase/server";

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Losuje do OSCE_TOPICS_PER_STATION tematów stacji i po OSCE_QUESTIONS_PER_TOPIC pytań z każdego.
 */
export async function fetchSimulationStationQuestions(
  stationId: string,
): Promise<TopicSessionQuestionRow[]> {
  const supabase = await createClient();

  const { data: topicRows, error: te } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", stationId);

  if (te || !topicRows?.length) {
    return [];
  }

  const topicIds = shuffle(topicRows.map((t) => t.id as string)).slice(
    0,
    Math.min(OSCE_TOPICS_PER_STATION, topicRows.length),
  );

  const out: TopicSessionQuestionRow[] = [];

  for (const topicId of topicIds) {
    const { data: qRows, error: qe } = await supabase
      .from("questions")
      .select(OSCE_QUESTIONS_COLUMNS)
      .eq("topic_id", topicId)
      .eq("is_active", true);

    if (qe || !qRows?.length) continue;

    const picked = shuffle(qRows as Record<string, unknown>[]).slice(
      0,
      OSCE_QUESTIONS_PER_TOPIC,
    );
    for (const row of picked) {
      out.push(mapRecordToTopicSessionQuestionRow(row));
    }
  }

  return out;
}
