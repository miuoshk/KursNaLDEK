import { hasCombinatorialOptions } from "@/features/session/lib/combinatorialOptions";
import { hasFixedOptionLetterRefsInExplanation } from "@/features/session/lib/explanationOptionRefs";

export type SessionOption = { id: string; text: string };

export type SessionOptionOrderContext = {
  disableOptionShuffle?: boolean;
  explanation?: string;
};

export function shouldKeepFixedOptionOrder(
  options: SessionOption[],
  ctx: SessionOptionOrderContext = {},
): boolean {
  if (ctx.disableOptionShuffle) return true;
  if (hasCombinatorialOptions(options)) return true;
  if (hasFixedOptionLetterRefsInExplanation(ctx.explanation ?? "")) return true;
  return false;
}

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

function optionShuffleSeed(sessionId: string, questionId: string): string {
  return `${sessionId}:${questionId}`;
}

/**
 * Kolejność opcji w sesji KNNP: shuffle per sesja (seed: sessionId + questionId),
 * chyba że meta-opcje, odwołania (A)–(E) w wyjaśnieniu lub ręczny zakaz admina —
 * wtedy kolejność z bazy.
 */
export function orderSessionOptions(
  sessionId: string,
  questionId: string,
  options: SessionOption[],
  ctx: SessionOptionOrderContext = {},
): SessionOption[] {
  if (options.length <= 1) return options;
  if (shouldKeepFixedOptionOrder(options, ctx)) return options;
  return seededShuffle(options, optionShuffleSeed(sessionId, questionId));
}

export function sessionOptionLetter(
  sessionId: string,
  questionId: string,
  options: SessionOption[],
  optionId: string,
  ctx: SessionOptionOrderContext = {},
): string {
  const ordered = orderSessionOptions(sessionId, questionId, options, ctx);
  const idx = ordered.findIndex((opt) => opt.id === optionId);
  if (idx < 0) return "?";
  return String.fromCharCode(65 + idx);
}
