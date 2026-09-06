/** Ten sam próg co `generateSessionInsights` — poniżej 60% to „skup się”. */
export const FOCUS_ACCURACY_THRESHOLD = 0.6;

export type FocusTopicHint = {
  topic: string;
  percent: number;
  weak: boolean;
};

export type FocusConceptHint = {
  concept: string;
  percent: number;
  weak: boolean;
};

/**
 * Najsłabszy temat z podsumowania — zawsze, nie tylko gdy ANTARES zdąży.
 * `weak` mówi, czy iść w copy „skup się”, czy „najsłabszy temat”.
 */
export function focusTopicFromBreakdown(
  topicBreakdown: { topicName: string; accuracy: number }[],
): FocusTopicHint | null {
  const worst = topicBreakdown[0];
  if (!worst) return null;
  const topic = worst.topicName.trim();
  if (!topic) return null;
  return {
    topic,
    percent: Math.round(worst.accuracy * 100),
    weak: worst.accuracy < FOCUS_ACCURACY_THRESHOLD,
  };
}

/**
 * Najsłabsze pojęcie z tej sesji. Wygrywa z tematem w stopce wskazówek.
 */
export function focusConceptFromBreakdown(
  concepts:
    | { label: string; correct: number; attempts: number }[]
    | undefined,
): FocusConceptHint | null {
  if (!concepts?.length) return null;
  const ranked = concepts
    .map((concept) => {
      const label = concept.label.trim();
      const attempts = concept.attempts;
      if (!label || attempts <= 0) return null;
      const accuracy = concept.correct / attempts;
      return {
        concept: label,
        percent: Math.round(accuracy * 100),
        weak: accuracy < FOCUS_ACCURACY_THRESHOLD,
        accuracy,
        attempts,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort(
      (a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts,
    );
  const worst = ranked[0];
  if (!worst) return null;
  return {
    concept: worst.concept,
    percent: worst.percent,
    weak: worst.weak,
  };
}

export type SummaryFocusPick =
  | { kind: "concept"; hint: FocusConceptHint }
  | { kind: "topic-server"; text: string }
  | { kind: "topic-local"; hint: FocusTopicHint };

/**
 * Pojęcie wygrywa z tematem. Temat z ANTARES tylko gdy brak pojęć.
 */
export function pickSummaryFocus(input: {
  concepts?: { label: string; correct: number; attempts: number }[];
  topicBreakdown: { topicName: string; accuracy: number }[];
  nextSessionFocus?: string | null;
}): SummaryFocusPick | null {
  const concept = focusConceptFromBreakdown(input.concepts);
  if (concept) return { kind: "concept", hint: concept };
  const server = input.nextSessionFocus?.trim();
  if (server) return { kind: "topic-server", text: server };
  const topic = focusTopicFromBreakdown(input.topicBreakdown);
  if (topic) return { kind: "topic-local", hint: topic };
  return null;
}
