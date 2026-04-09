/** Stan wiedzy w jednym temacie (wejście z cache / statystyk). */
export type TopicKnowledgeState = {
  topicId: string;
  subjectId: string;
  topicName: string;
  totalQuestions: number;
  seenQuestions: number;
  coverageRatio: number;
  accuracy: number;
  avgRetrievability: number;
  masteryScore: number;
  weaknessRank: number;
  trend: "improving" | "stable" | "declining";
  questionsLast7d: number;
  accuracyLast7d: number | null;
  leechCount: number;
};

/** Dane wejściowe do jednorazowego przeliczenia gotowości egzaminacyjnej. */
export type ExamReadinessInput = {
  topicStates: TopicKnowledgeState[];
  examDate: Date | null;
  questionsAnsweredTotal: number;
  daysActive: number;
};

/** Wynik obliczenia gotowości egzaminacyjnej. */
export type ExamReadinessResult = {
  /** Wynik 0–100: ważona średnia opanowania z karą za niskie pokrycie. */
  score: number;
  /** Krótka etykieta opisowa dla użytkownika. */
  verdict: string;
  /** Do trzech identyfikatorów tematów o najniższym `masteryScore`. */
  weakestTopics: string[];
  /** Szacowana data „gotowości” przy stałym tempie odpowiedzi/dzień; null gdy brak danych. */
  estimatedReadyDate: Date | null;
  /** Sugerowana liczba pytań dziennie do egzaminu (10–100) lub 25 bez sensownej projekcji. */
  dailyRecommendation: number;
};

function weightedAverage(
  topics: TopicKnowledgeState[],
  pick: (t: TopicKnowledgeState) => number,
): number {
  let wSum = 0;
  let num = 0;
  for (const t of topics) {
    const w = Math.max(0, t.totalQuestions);
    if (w === 0) continue;
    wSum += w;
    num += pick(t) * w;
  }
  return wSum > 0 ? num / wSum : 0;
}

function remainingQuestionsTotal(topics: TopicKnowledgeState[]): number {
  let s = 0;
  for (const t of topics) {
    s += Math.max(0, t.totalQuestions - t.seenQuestions);
  }
  return s;
}

/**
 * Szacuje „gotowość egzaminacyjną” na podstawie stanu tematów, terminu egzaminu
 * oraz ogólnej aktywności (pytania łącznie, dni aktywności).
 *
 * **Wynik punktowy:** `avgMastery` (średnia ważona `masteryScore`, wagi = `totalQuestions`)
 * mnożona przez `coveragePenalty` (gdy średnie pokrycie &lt; 0,5: `avgCoverage / 0,5`, inaczej 1),
 * następnie skalowana do 0–100.
 */
export function calculateExamReadiness(
  input: ExamReadinessInput,
  now = new Date(),
): ExamReadinessResult {
  const { topicStates, examDate, questionsAnsweredTotal, daysActive } = input;

  if (topicStates.length === 0) {
    return {
      score: 0,
      verdict: "Brak danych",
      weakestTopics: [],
      estimatedReadyDate: null,
      dailyRecommendation: 25,
    };
  }

  const avgMastery = weightedAverage(topicStates, (t) => t.masteryScore);
  const avgCoverage = weightedAverage(topicStates, (t) => t.coverageRatio);

  const coveragePenalty = avgCoverage < 0.5 ? avgCoverage / 0.5 : 1.0;
  const score = Math.round(
    Math.min(1, Math.max(0, avgMastery * coveragePenalty)) * 100,
  );

  let verdict: string;
  if (score >= 85) {
    verdict = "Zdasz z marszu";
  } else if (score >= 70) {
    verdict = "Dobrze rokuje";
  } else if (score >= 50) {
    verdict = "W połowie drogi";
  } else {
    verdict = "Dużo do nadrobienia";
  }

  const weakestTopics = [...topicStates]
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3)
    .map((t) => t.topicId);

  const remaining = remainingQuestionsTotal(topicStates);
  const velocity =
    daysActive > 0 ? questionsAnsweredTotal / daysActive : 0;

  let estimatedReadyDate: Date | null = null;
  if (remaining > 0 && velocity > 0) {
    const daysNeeded = remaining / velocity;
    const d = new Date(now);
    d.setTime(d.getTime() + daysNeeded * 86_400_000);
    estimatedReadyDate = d;
  } else if (remaining <= 0) {
    estimatedReadyDate = new Date(now);
  }

  let dailyRecommendation = 25;
  if (examDate && remaining > 0) {
    const ms = examDate.getTime() - now.getTime();
    const daysToExam = Math.max(1, Math.ceil(ms / 86_400_000));
    const raw = remaining / daysToExam;
    dailyRecommendation = Math.min(100, Math.max(10, Math.round(raw)));
  }

  return {
    score,
    verdict,
    weakestTopics,
    estimatedReadyDate,
    dailyRecommendation,
  };
}
