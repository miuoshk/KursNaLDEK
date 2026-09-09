import { renderExplanationBlocks } from "../../features/shared/lib/renderExplanationBlocks";

export { renderExplanationBlocks };

/** @deprecated Użyj renderExplanationBlocks — ten alias zostaje dla testów KROK 6. */
export const renderExplanationBlocksTs = renderExplanationBlocks;

export function stripEmojiForInvariant(text: string): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp == null) continue;
    if (
      (cp >= 0x2600 && cp <= 0x27bf) ||
      (cp >= 0x1f300 && cp <= 0x1faff)
    ) {
      continue;
    }
    out += ch;
  }
  return out;
}

export function normalizeInvariantText(text: string): string {
  let value = text.replace(/\r\n/g, "\n").replace(/Haczyk/g, "Zasada");
  value = stripEmojiForInvariant(value);
  const lines = value.split("\n").map((line) => {
    const trimmed = line.replace(/[ \t]+/g, " ").trim();
    if (/^\|[-: |]+$/.test(trimmed.replace(/\s+/g, ""))) {
      return "|---|";
    }
    return trimmed.replace(/\s*\|\s*/g, "|").replace(/^\|/, "|").replace(/\|$/, "|");
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function charDiffRatio(left: string, right: string): number {
  const maxLen = Math.max(left.length, right.length, 1);
  return levenshteinLocal(left, right) / maxLen;
}

function levenshteinLocal(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  const next = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i += 1) {
    next[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      next[j] = Math.min(prev[j] + 1, next[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = next[j];
  }
  return prev[b.length];
}
