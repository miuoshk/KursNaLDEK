/**
 * Liczy priorytet (0–1) dla **nowego**, jeszcze niepokazywanego pytania:
 * wyższy wynik oznacza większe prawdopodobieństwo wyboru w kolejce nauki.
 *
 * Składa się z pilności pokrycia tematu oraz wzmocnienia dla słabiej
 * opanowanych tematów.
 */
export function calculateNewQuestionPriority(input: {
  topicMasteryScore: number;
  topicCoverageRatio: number;
}): number {
  const coverageUrgency = 1 - input.topicCoverageRatio;
  const weaknessBoost = 1 - input.topicMasteryScore;

  const raw = coverageUrgency * 0.55 + weaknessBoost * 0.45;

  return Math.min(1, Math.max(0, raw));
}
