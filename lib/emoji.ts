const EMOJI_PICTOGRAPHIC = /\p{Extended_Pictographic}/u;

/** Regional Indicator symbols (U+1F1E6–U+1F1FF) — składowe flag krajów (np. 🇵🇱). */
function isRegionalIndicatorChar(ch: string): boolean {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return false;
  return cp >= 0x1f1e6 && cp <= 0x1f1ff;
}

/**
 * Flaga z dwóch Regional Indicatorów (i opcjonalnie U+FE0F na końcu).
 * Nie używamy \p{Regional_Indicator} — część środowisk/SSR ma problemy; kod bywa pewniejszy.
 */
function isIsoRegionalFlag(codePoints: string[]): boolean {
  if (codePoints.length === 2) {
    return isRegionalIndicatorChar(codePoints[0]!) && isRegionalIndicatorChar(codePoints[1]!);
  }
  if (codePoints.length === 3) {
    return (
      isRegionalIndicatorChar(codePoints[0]!) &&
      isRegionalIndicatorChar(codePoints[1]!) &&
      codePoints[2] === "\uFE0F"
    );
  }
  return false;
}

const MAX_CODE_POINTS = 24;

export function isValidEmoji(value: string): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;

  /* maxLength w <input> liczy UTF-16; tutaj ograniczamy „złożoność” po code pointach
     i dajemy zapas na długie sekwencje ZWJ (rodziny, flagi subregionów). */
  const nfc = trimmed.normalize("NFC");
  const codePoints = [...nfc];
  if (codePoints.length === 0 || codePoints.length > MAX_CODE_POINTS) return false;
  /* Awaryjny limit długości surowej — ochrona przed absurdalnie długimi wklejkami. */
  if (nfc.length > 96) return false;

  if (isIsoRegionalFlag(codePoints)) {
    return true;
  }

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("pl", { granularity: "grapheme" });
    const graphemes = [...segmenter.segment(nfc)];
    if (graphemes.length === 1) {
      const seg = graphemes[0]!.segment;
      return EMOJI_PICTOGRAPHIC.test(seg) || isIsoRegionalFlag([...seg]);
    }
    if (graphemes.length === 2) {
      const a = graphemes[0]!.segment;
      const b = graphemes[1]!.segment;
      return isIsoRegionalFlag([a, b]);
    }
    if (graphemes.length === 3) {
      const a = graphemes[0]!.segment;
      const b = graphemes[1]!.segment;
      const c = graphemes[2]!.segment;
      return isIsoRegionalFlag([a, b, c]);
    }
    return false;
  }

  return EMOJI_PICTOGRAPHIC.test(nfc) || isIsoRegionalFlag(codePoints);
}

export function sanitizeEmoji(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return isValidEmoji(trimmed) ? trimmed : null;
}
