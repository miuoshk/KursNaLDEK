export type SourceAccuracySlice = {
  total: number;
  seen: number;
  correct: number;
};

export type SourceAccuracyBreakdown = {
  product: string;
  reference: SourceAccuracySlice;
  own: SourceAccuracySlice;
  protectedCount: number;
};

/** Trafność wiersza karty: correct / seen, bez mieszania ze sobą źródeł. */
export function sourceSliceAccuracy(
  slice: SourceAccuracySlice,
): number | null {
  if (slice.seen <= 0) return null;
  return Math.min(1, Math.max(0, slice.correct / slice.seen));
}

export function emptySourceSlice(): SourceAccuracySlice {
  return { total: 0, seen: 0, correct: 0 };
}

export function addSourceSlices(
  a: SourceAccuracySlice,
  b: SourceAccuracySlice,
): SourceAccuracySlice {
  return {
    total: a.total + b.total,
    seen: a.seen + b.seen,
    correct: a.correct + b.correct,
  };
}
