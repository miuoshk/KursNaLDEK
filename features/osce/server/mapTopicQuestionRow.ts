import type { TopicSessionQuestionRow } from "@/features/osce/types";

export function mapRecordToTopicSessionQuestionRow(
  row: Record<string, unknown>,
): TopicSessionQuestionRow {
  const ts = row.timer_seconds;
  let timerSeconds: number | null = null;
  if (ts != null) {
    const n = typeof ts === "number" ? ts : Number(ts);
    timerSeconds = Number.isFinite(n) ? n : null;
  }
  return {
    id: row.id as string,
    text: row.text as string,
    options: row.options,
    correct_option_id: row.correct_option_id as string,
    explanation: row.explanation as string,
    image_url: (row.image_url as string | null) ?? null,
    question_type: (row.question_type as string | null) ?? null,
    timer_seconds: timerSeconds,
    correct_order: row.correct_order ?? null,
    learning_outcome: (row.learning_outcome as string | null) ?? null,
    hotspots: row.hotspots ?? null,
    drill_questions: row.drill_questions ?? null,
    identify_mode: (row.identify_mode as string | null) ?? null,
  };
}
