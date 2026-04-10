const DIFF_MAP: Record<string, number> = {
  latwe: 0.3,
  srednie: 0.6,
  trudne: 0.9,
};

/**
 * Liczy priorytet (0–1) dla **nowego**, jeszcze niepokazywanego pytania:
 * wyższy wynik oznacza większe prawdopodobieństwo wyboru w kolejce nauki.
 *
 * Składa się z pilności pokrycia tematu, dopasowania trudności do poziomu
 * studenta oraz wzmocnienia dla słabiej opanowanych tematów.
 */
export function calculateNewQuestionPriority(input: {
  topicMasteryScore: number;
  topicCoverageRatio: number;
  questionDifficulty: string;
  studentAccuracyLast20: number;
}): number {
  const coverageUrgency = 1 - input.topicCoverageRatio;

  const targetDiff =
    DIFF_MAP[input.questionDifficulty] ?? DIFF_MAP.srednie;
  const difficultyFit =
    1 - Math.abs(input.studentAccuracyLast20 - targetDiff);

  const weaknessBoost = 1 - input.topicMasteryScore;

  const raw =
    coverageUrgency * 0.4 +
    difficultyFit * 0.3 +
    weaknessBoost * 0.3;

  return Math.min(1, Math.max(0, raw));
}
