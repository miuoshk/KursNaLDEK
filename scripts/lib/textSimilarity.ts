/** Lowercase, strip punctuation, collapse spaces — matching KROK 6 spec. */
export function normalizeMatchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
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

function trigrams(value: string): string[] {
  const padded = `  ${value} `;
  const grams: string[] = [];
  for (let index = 0; index < padded.length - 2; index += 1) {
    grams.push(padded.slice(index, index + 3));
  }
  return grams;
}

export function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length && !b.length) return 1;
  const left = trigrams(a);
  const right = new Map<string, number>();
  for (const gram of trigrams(b)) {
    right.set(gram, (right.get(gram) ?? 0) + 1);
  }
  let overlap = 0;
  for (const gram of left) {
    const count = right.get(gram) ?? 0;
    if (count > 0) {
      overlap += 1;
      right.set(gram, count - 1);
    }
  }
  return (2 * overlap) / (left.length + trigrams(b).length);
}

export function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/** Better of trigram Dice and Levenshtein ratio on already-normalized strings. */
export function similarity(a: string, b: string): number {
  return Math.max(trigramSimilarity(a, b), levenshteinSimilarity(a, b));
}

/** Lists like „1, 2 i 3” / „1 oraz 4” after normalizeMatchText. */
export const NUMERIC_LIST_RE =
  /^[0-9]+([,\s]+(i|oraz)?[\s,]*[0-9]+)*$/;

export function isNumericOptionList(text: string): boolean {
  return NUMERIC_LIST_RE.test(normalizeMatchText(text));
}

export function numberSetFromText(text: string): number[] {
  const seen = new Set<number>();
  for (const match of normalizeMatchText(text).matchAll(/\d+/g)) {
    seen.add(Number(match[0]));
  }
  return [...seen].sort((left, right) => left - right);
}

export function numberSetsEqual(left: string, right: string): boolean {
  const a = numberSetFromText(left);
  const b = numberSetFromText(right);
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}
