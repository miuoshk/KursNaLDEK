import type { StrengthenedConcept } from "@/features/session/summaryTypes";

/** Sesja poniżej tego n (odpowiedzi) to szum — bez trendów. */
export const SUMMARY_MICRO_MAX_N = 5;
/** Poniżej tego progu (i nie-micro) — wariant weak. */
export const SUMMARY_WEAK_ACCURACY = 0.5;
/** Porównanie z poprzednią sesją tylko gdy obie mają n >= tej wartości. */
export const SUMMARY_COMPARE_MIN_N = 5;
/** Filtr „tylko błędne” od tej liczby pytań. */
export const SUMMARY_WRONG_FILTER_MIN_N = 10;
/** Skrót treści pytania w wierszu przebiegu. */
export const SUMMARY_QUESTION_SNIPPET_MAX = 80;

export type SummaryVariant = "micro" | "weak" | "good";

export type SummaryVariantInput = {
  answers: { length: number };
  accuracy: number;
  previousAccuracy?: number | null;
  previousTotalQuestions?: number | null;
};

export function getSummaryVariant(session: SummaryVariantInput): SummaryVariant {
  if (session.answers.length < SUMMARY_MICRO_MAX_N) return "micro";
  if (session.accuracy < SUMMARY_WEAK_ACCURACY) return "weak";
  return "good";
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
