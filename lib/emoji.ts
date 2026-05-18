const EMOJI_PICTOGRAPHIC = /\p{Extended_Pictographic}/u;

export function isValidEmoji(value: string): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 16) return false;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("pl", { granularity: "grapheme" });
    const graphemes = [...segmenter.segment(trimmed)];
    if (graphemes.length !== 1) return false;
    return EMOJI_PICTOGRAPHIC.test(graphemes[0]!.segment);
  }

  return EMOJI_PICTOGRAPHIC.test(trimmed);
}

export function sanitizeEmoji(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return isValidEmoji(trimmed) ? trimmed : null;
}
