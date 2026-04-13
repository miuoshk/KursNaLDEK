import type { SessionQuestion } from "@/features/session/types";

export type QuestionRow = {
  id: string;
  topic_id?: string | null;
  text: string;
  options: unknown;
  correct_option_id: string;
  explanation: string;
  source_code: string | null;
  topics: { name: string } | { name: string }[] | null;
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
    options: shuffleArray(options),
    correctOptionId: row.correct_option_id,
    explanation: row.explanation,
    sourceCode: row.source_code,
    topicName: topicLabel(row.topics),
    topicId: row.topic_id ?? undefined,
  };
}
