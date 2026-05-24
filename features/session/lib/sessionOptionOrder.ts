import { hasCombinatorialOptions } from "@/features/session/lib/combinatorialOptions";

export type SessionOption = { id: string; text: string };

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  const rand = mulberry32(hashSeed(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Kolejność opcji w sesji KNNP: shuffle, chyba że pytanie ma meta-opcje
 * (np. „prawidłowe A i C", „wszystkie fałszywe") — wtedy zostaje kolejność z bazy.
 */
export function orderSessionOptions(
  questionId: string,
  options: SessionOption[],
  disableOptionShuffle = false,
): SessionOption[] {
  if (options.length <= 1) return options;
  if (disableOptionShuffle || hasCombinatorialOptions(options)) return options;
  return seededShuffle(options, questionId);
}

export function sessionOptionLetter(
  questionId: string,
  options: SessionOption[],
  optionId: string,
  disableOptionShuffle = false,
): string {
  const ordered = orderSessionOptions(
    questionId,
    options,
    disableOptionShuffle,
  );
  const idx = ordered.findIndex((opt) => opt.id === optionId);
  if (idx < 0) return "?";
  return String.fromCharCode(65 + idx);
}
