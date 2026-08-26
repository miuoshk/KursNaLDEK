import type { SessionQuestion } from "@/features/session/types";
import { normalizeStructuredExplanation } from "@/features/session/lib/structuredExplanation";

export type QuestionRow = {
  id: string;
  topic_id?: string | null;
  text: string;
  options: unknown;
  correct_option_id: string;
  explanation: string;
  explanation_blocks?: unknown;
  source_code: string | null;
  image_url?: string | null;
  disable_option_shuffle?: boolean | null;
  source?: string | null;
  repeat_count?: number | null;
  first_seen_session?: string | null;
  source_exam?: string | null;
  cemSessionLabel?: string | null;
  cemQuestionNumber?: number | null;
  question_concepts?:
    | { concept_id: string; relation?: string; weight?: number }[]
    | { concept_id: string; relation?: string; weight?: number }
    | null;
  topics:
    | { name: string; knowledge_card?: string | null }
    | { name: string; knowledge_card?: string | null }[]
    | null;
};

function topicLabel(topics: QuestionRow["topics"]): string {
  if (!topics) return "Temat";
  if (Array.isArray(topics)) return topics[0]?.name ?? "Temat";
  return topics.name ?? "Temat";
}

function topicKnowledgeCard(topics: QuestionRow["topics"]): string | null {
  if (!topics) return null;
  if (Array.isArray(topics)) return topics[0]?.knowledge_card ?? null;
  return topics.knowledge_card ?? null;
}

export function mapRowToSessionQuestion(row: QuestionRow): SessionQuestion {
  const raw = row.options;
  const options = Array.isArray(raw)
    ? (raw as { id: string; text: string }[])
    : typeof raw === "string"
      ? (JSON.parse(raw) as { id: string; text: string }[])
      : [];

  const conceptLinks = Array.isArray(row.question_concepts)
    ? row.question_concepts
    : row.question_concepts
      ? [row.question_concepts]
      : [];
  const primaryConcepts = conceptLinks.filter(
    (entry) => entry.relation === "primary",
  );

  return {
    id: row.id,
    text: row.text,
    options,
    correctOptionId: row.correct_option_id,
    explanation: row.explanation,
    explanationBlocks: normalizeStructuredExplanation(row.explanation_blocks),
    sourceCode: row.source_code,
    imageUrl: row.image_url ?? null,
    topicName: topicLabel(row.topics),
    knowledgeCard: topicKnowledgeCard(row.topics),
    topicId: row.topic_id ?? undefined,
    conceptIds: (primaryConcepts.length > 0
      ? primaryConcepts
      : conceptLinks
    ).map((entry) => entry.concept_id),
    disableOptionShuffle: row.disable_option_shuffle === true,
    source: row.source ?? undefined,
    repeatCount: row.repeat_count ?? undefined,
    firstSeenSession: row.first_seen_session ?? undefined,
    sourceExam: row.source_exam ?? undefined,
    cemSessionLabel: row.cemSessionLabel ?? undefined,
    cemQuestionNumber: row.cemQuestionNumber ?? undefined,
  };
}
