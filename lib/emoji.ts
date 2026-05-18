const EMOJI_PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
/** Krajowe flagi UNICODE (np. 🇵🇱): dwa codepointy Regional Indicator — nie są Extended_Pictographic. */
const REGIONAL_FLAG_PAIR = /^\p{Regional_Indicator}{2}$/u;

export function isValidEmoji(value: string): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 16) return false;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("pl", { granularity: "grapheme" });
    const graphemes = [...segmenter.segment(trimmed)];
    if (graphemes.length === 1) {
      const seg = graphemes[0]!.segment;
      return (
        EMOJI_PICTOGRAPHIC.test(seg) ||
        REGIONAL_FLAG_PAIR.test(seg)
      );
    }
    /* Część silników dzieli flagę 🇵🇱 na dwa pojedyncze RI zamiast jednego klastra. */
    if (graphemes.length === 2) {
      const a = graphemes[0]!.segment;
      const b = graphemes[1]!.segment;
      const pair = a + b;
      if (
        /^\p{Regional_Indicator}$/u.test(a) &&
        /^\p{Regional_Indicator}$/u.test(b) &&
        pair.length <= 16
      ) {
        return true;
      }
    }
    return false;
  }

  return (
    EMOJI_PICTOGRAPHIC.test(trimmed) ||
    REGIONAL_FLAG_PAIR.test(trimmed)
  );
}

export function sanitizeEmoji(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return isValidEmoji(trimmed) ? trimmed : null;
}
