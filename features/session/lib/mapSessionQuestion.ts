import type { SessionQuestion } from "@/features/session/types";

export type QuestionRow = {
  id: string;
  topic_id?: string | null;
  text: string;
  options: unknown;
  correct_option_id: string;
  explanation: string;
  source_code: string | null;
  image_url?: string | null;
  disable_option_shuffle?: boolean | null;
  topics: { name: string } | { name: string }[] | null;
};

function topicLabel(topics: QuestionRow["topics"]): string {
  if (!topics) return "Temat";
  if (Array.isArray(topics)) return topics[0]?.name ?? "Temat";
  return topics.name ?? "Temat";
}

export function mapRowToSessionQuestion(row: QuestionRow): SessionQuestion {
  const raw = row.options;
  const options = Array.isArray(raw)
    ? (raw as { id: string; text: string }[])
    : typeof raw === "string"
      ? (JSON.parse(raw) as { id: string; text: string }[])
      : [];

  return {
    id: row.id,
    text: row.text,
    options,
    correctOptionId: row.correct_option_id,
    explanation: row.explanation,
    sourceCode: row.source_code,
    imageUrl: row.image_url ?? null,
    topicName: topicLabel(row.topics),
    topicId: row.topic_id ?? undefined,
    disableOptionShuffle: row.disable_option_shuffle === true,
  };
}
