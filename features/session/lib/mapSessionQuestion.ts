import type { SessionQuestion } from "@/features/session/types";

export type QuestionRow = {
  id: string;
  text: string;
  options: unknown;
  correct_option_id: string;
  explanation: string;
  difficulty: string;
  source_code: string | null;
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
    difficulty: row.difficulty,
    sourceCode: row.source_code,
    topicName: topicLabel(row.topics),
  };
}
