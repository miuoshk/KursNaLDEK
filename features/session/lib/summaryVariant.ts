import type { StrengthenedConcept } from "@/features/session/summaryTypes";

/** Sesja poniżej tego n (odpowiedzi) to szum — bez trendów. */
export const SUMMARY_MICRO_MAX_N = 5;
/** Poniżej tego progu (i nie-micro) — wariant weak. */
export const SUMMARY_WEAK_ACCURACY = 0.5;
/** Od tego progu (i poniżej perfect) — wariant great. */
export const SUMMARY_GREAT_ACCURACY = 0.8;
/** Dokładnie 100% (i nie-micro) — wariant perfect. */
export const SUMMARY_PERFECT_ACCURACY = 1;
/** Porównanie z poprzednią sesją tylko gdy obie mają n >= tej wartości. */
export const SUMMARY_COMPARE_MIN_N = 5;
/** Filtr „tylko błędne” od tej liczby pytań. */
export const SUMMARY_WRONG_FILTER_MIN_N = 10;
/** Skrót treści pytania w wierszu przebiegu. */
export const SUMMARY_QUESTION_SNIPPET_MAX = 80;

export type SummaryVariant = "micro" | "weak" | "good" | "great" | "perfect";

/** Długość puli nagłówków per wariant — musi zgadzać się z kluczami i18n. */
export const SUMMARY_VERDICT_POOL_SIZE: Record<SummaryVariant, number> = {
  micro: 5,
  weak: 9,
  good: 9,
  great: 6,
  perfect: 5,
};

export type SummaryVariantInput = {
  answers: { length: number };
  accuracy: number;
  previousAccuracy?: number | null;
  previousTotalQuestions?: number | null;
};

export function getSummaryVariant(session: SummaryVariantInput): SummaryVariant {
  if (session.answers.length < SUMMARY_MICRO_MAX_N) return "micro";
  if (session.accuracy < SUMMARY_WEAK_ACCURACY) return "weak";
  if (session.accuracy < SUMMARY_GREAT_ACCURACY) return "good";
  if (session.accuracy < SUMMARY_PERFECT_ACCURACY) return "great";
  return "perfect";
}

/** FNV-1a 32-bit — ten sam sessionId zawsze ten sam indeks. */
export function hashSessionId(sessionId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < sessionId.length; i += 1) {
    hash ^= sessionId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pickVerdictIndex(sessionId: string, poolSize: number): number {
  if (poolSize <= 0) return 0;
  return hashSessionId(sessionId) % poolSize;
}

export function pickVerdictMessageKeys(
  sessionId: string,
  variant: SummaryVariant,
): { titleKey: string; subtitleKey: string } {
  const poolSize = SUMMARY_VERDICT_POOL_SIZE[variant];
  const n = pickVerdictIndex(sessionId, poolSize) + 1;
  const cap = `${variant.charAt(0).toUpperCase()}${variant.slice(1)}`;
  return {
    titleKey: `summaryVerdict${cap}${n}Title`,
    subtitleKey: `summaryVerdict${cap}${n}Subtitle`,
  };
}

/** L2 builder zawsze ustawia previousTotalQuestions (number | null). L1 zostawia undefined. */
export function isSummaryLayer2Ready(session: {
  previousTotalQuestions?: number | null;
}): boolean {
  return session.previousTotalQuestions !== undefined;
}

export function canComparePreviousSession(
  session: SummaryVariantInput,
): boolean {
  if (getSummaryVariant(session) === "micro") return false;
  if (!isSummaryLayer2Ready(session)) return false;
  if (session.previousAccuracy == null) return false;
  if (session.previousTotalQuestions == null) return false;
  if (session.answers.length < SUMMARY_COMPARE_MIN_N) return false;
  if (session.previousTotalQuestions < SUMMARY_COMPARE_MIN_N) return false;
  return true;
}

export function isFirstSubjectSession(session: {
  previousTotalQuestions?: number | null;
  previousAccuracy?: number | null;
}): boolean {
  if (!isSummaryLayer2Ready(session)) return false;
  return (
    session.previousAccuracy == null && session.previousTotalQuestions == null
  );
}

export function summaryQuestionSnippet(
  text: string,
  max = SUMMARY_QUESTION_SNIPPET_MAX,
): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1)}…`;
}

export type SummaryFooterAction = "finish" | "retry" | "next";

export function resolveSummaryFooterActions(
  variant: SummaryVariant,
  wrongCount: number,
): { primary: SummaryFooterAction; secondary: SummaryFooterAction | null } {
  const hasWrongs = wrongCount > 0;
  if (variant === "micro") {
    return { primary: "finish", secondary: hasWrongs ? "retry" : null };
  }
  if (variant === "great" || variant === "perfect") {
    return { primary: "next", secondary: hasWrongs ? "retry" : null };
  }
  return {
    primary: hasWrongs ? "retry" : "next",
    secondary: hasWrongs ? "next" : null,
  };
}

export function splitSessionConcepts(concepts: StrengthenedConcept[]): {
  mastered: StrengthenedConcept[];
  review: StrengthenedConcept[];
} {
  const mastered = concepts.filter(
    (c) => c.attempts > 0 && c.correct === c.attempts,
  );
  const review = concepts
    .filter((c) => c.attempts > 0 && c.correct < c.attempts)
    .sort((a, b) => {
      const accA = a.correct / a.attempts;
      const accB = b.correct / b.attempts;
      return (
        accA - accB ||
        b.attempts - a.attempts ||
        a.label.localeCompare(b.label, "pl")
      );
    });
  return { mastered, review };
}
