export type StructuredExplanation = {
  takeaway: string;
  correctReason: string;
  distractors: Record<string, string>;
};

function cleanText(value: unknown, maxLength = 8_000): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function normalizeStructuredExplanation(
  value: unknown,
): StructuredExplanation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const rawDistractors =
    input.distractors &&
    typeof input.distractors === "object" &&
    !Array.isArray(input.distractors)
      ? (input.distractors as Record<string, unknown>)
      : {};
  const distractors = Object.fromEntries(
    Object.entries(rawDistractors)
      .map(([key, reason]) => [key.toLowerCase(), cleanText(reason, 2_000)])
      .filter(([key, reason]) => /^[a-z0-9_-]{1,8}$/.test(key) && reason),
  );

  const result: StructuredExplanation = {
    takeaway: cleanText(input.takeaway, 2_000),
    correctReason: cleanText(input.correctReason),
    distractors,
  };

  return result.takeaway ||
    result.correctReason ||
    Object.keys(result.distractors).length > 0
    ? result
    : null;
}

export function structuredExplanationForStorage(
  value: StructuredExplanation,
): StructuredExplanation | null {
  return normalizeStructuredExplanation(value);
}
