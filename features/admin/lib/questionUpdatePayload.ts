import type { ExplanationBlocksV2 } from "@/features/shared/lib/explanationBlocks";

export type QuestionUpdateFields = {
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  explanationBlocks?: ExplanationBlocksV2 | null;
  isActive: boolean;
  sourceExam: string | null;
  sourceCode: string | null;
  imageUrl: string | null;
  topicId: string | null;
  themeLabel: string | null;
  subthemeLabel: string | null;
  batchLabel: string | null;
  learningOutcome: string | null;
  disableOptionShuffle: boolean;
};

export function buildQuestionUpdatePayload(data: QuestionUpdateFields) {
  const payload: Record<string, unknown> = {
    text: data.text,
    options: data.options,
    correct_option_id: data.correctOptionId,
    explanation: data.explanation,
    is_active: data.isActive,
    source_exam: data.sourceExam,
    source_code: data.sourceCode,
    image_url: data.imageUrl,
    topic_id: data.topicId,
    theme_label: data.themeLabel,
    subtheme_label: data.subthemeLabel,
    batch_label: data.batchLabel,
    learning_outcome: data.learningOutcome,
    disable_option_shuffle: data.disableOptionShuffle,
  };

  if (data.explanationBlocks !== undefined) {
    payload.explanation_blocks = data.explanationBlocks;
  }

  return payload;
}
