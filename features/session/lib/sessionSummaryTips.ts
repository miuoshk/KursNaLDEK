/** Ten sam próg co `generateSessionInsights` — poniżej 60% to „skup się”. */
export const FOCUS_ACCURACY_THRESHOLD = 0.6;

export type FocusTopicHint = {
  topic: string;
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
