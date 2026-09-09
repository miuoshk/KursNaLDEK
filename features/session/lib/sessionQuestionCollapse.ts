type QuestionLengthInput = {
  text: string;
  options: { text: string }[];
  imageUrl?: string | null;
};

/** Stem + options long enough that collapsing after submit is useful. */
export const LONG_QUESTION_TEXT_CHARS = 360;
export const LONG_STEM_CHARS = 220;
export const LONG_OPTION_CHARS = 140;

export function isLongSessionQuestion(question: QuestionLengthInput): boolean {
  const optionChars = question.options.reduce(
    (sum, option) => sum + option.text.length,
    0,
  );
  if (question.text.length >= LONG_STEM_CHARS) return true;
  if (question.options.some((option) => option.text.length >= LONG_OPTION_CHARS)) {
    return true;
  }
  if (question.text.length + optionChars >= LONG_QUESTION_TEXT_CHARS) return true;
  return Boolean(question.imageUrl) && question.text.length >= 120;
}
