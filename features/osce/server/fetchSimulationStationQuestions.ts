"use server";

import {
  OSCE_QUESTIONS_PER_TOPIC,
  OSCE_TOPICS_PER_STATION,
} from "@/features/osce/constants/osceSimulation";
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

function mapQuestionRow(row: Record<string, unknown>): TopicSessionQuestionRow {
  return {
    id: row.id as string,
    text: row.text as string,
    options: row.options,
    correct_option_id: row.correct_option_id as string,
    explanation: row.explanation as string,
    difficulty: (row.difficulty as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    question_type: (row.question_type as string | null) ?? null,
    extra: (row.extra as Record<string, unknown> | null) ?? null,
  };
}

/**
 * Losuje do OSCE_TOPICS_PER_STATION topików stacji i po OSCE_QUESTIONS_PER_TOPIC pytania z każdego.
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
      .select(
        "id, text, options, correct_option_id, explanation, difficulty, image_url, is_active, question_type, extra",
      )
      .eq("topic_id", topicId)
      .eq("is_active", true);

    if (qe || !qRows?.length) continue;

    const picked = shuffle(qRows as Record<string, unknown>[]).slice(
      0,
      OSCE_QUESTIONS_PER_TOPIC,
    );
    for (const row of picked) {
      out.push(mapQuestionRow(row));
    }
  }

  return out;
}
