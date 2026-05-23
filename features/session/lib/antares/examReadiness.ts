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
  /** Trafność bieżącej sesji — wzmacnia wstępną ocenę przy małej liczbie danych. */
  sessionAccuracy?: number;
};

/** Wynik obliczenia gotowości egzaminacyjnej. */
export type ExamReadinessResult = {
  /** Wynik 0–100: opanowanie × pokrycie materiału, z korektą pewności. */
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

function coveragePenalty(globalCoverage: number): number {
  if (globalCoverage >= 0.65) return 1;
  if (globalCoverage >= 0.35) return 0.55 + (globalCoverage - 0.35) * (0.45 / 0.3);
  return 0.25 + (globalCoverage / 0.35) * 0.3;
}

function baseVerdict(score: number): string {
  if (score >= 85) return "Zdasz z marszu";
  if (score >= 70) return "Dobrze rokuje";
  if (score >= 50) return "W połowie drogi";
  if (score >= 25) return "Dużo do nadrobienia";
  return "Na początku drogi";
}

/**
 * Szacuje gotowość egzaminacyjną na podstawie cache tematów, aktywności
 * i (opcjonalnie) trafności bieżącej sesji.
 *
 * **Wynik:** średnia ważona `masteryScore` po tematach, które user widział,
 * × kara za niskie pokrycie materiału w cache, z wstępną kalibracją przy &lt;50 odpowiedziach.
 */
export function calculateExamReadiness(
  input: ExamReadinessInput,
  now = new Date(),
): ExamReadinessResult {
  const {
    topicStates,
    examDate,
    questionsAnsweredTotal,
    daysActive,
    sessionAccuracy,
  } = input;

  const engaged = topicStates.filter((t) => t.seenQuestions > 0);

  if (engaged.length === 0) {
    if (questionsAnsweredTotal >= 5 && sessionAccuracy != null) {
      const bootstrap = Math.round(
        Math.min(45, sessionAccuracy * 100 * Math.min(1, questionsAnsweredTotal / 80)),
      );
      return {
        score: bootstrap,
        verdict: "Wstępna ocena — kontynuuj naukę",
        weakestTopics: [],
        estimatedReadyDate: null,
        dailyRecommendation: 25,
      };
    }
    return {
      score: 0,
      verdict: "Za mało danych — ukończ kilka sesji",
      weakestTopics: [],
      estimatedReadyDate: null,
      dailyRecommendation: 25,
    };
  }

  const avgMastery = weightedAverage(engaged, (t) => t.masteryScore);

  const totalSeen = topicStates.reduce((s, t) => s + t.seenQuestions, 0);
  const totalPool = topicStates.reduce((s, t) => s + t.totalQuestions, 0);
  const globalCoverage = totalPool > 0 ? totalSeen / totalPool : 0;

  let score = Math.round(
    Math.min(1, Math.max(0, avgMastery * coveragePenalty(globalCoverage))) * 100,
  );

  const isPreliminary = questionsAnsweredTotal < 50;
  if (isPreliminary && sessionAccuracy != null) {
    const sessionPct = Math.round(sessionAccuracy * 100);
    const blend = Math.min(1, questionsAnsweredTotal / 50);
    score = Math.round(score * blend + sessionPct * (1 - blend) * 0.35);
  }

  score = Math.min(100, Math.max(0, score));

  let verdict = baseVerdict(score);
  if (globalCoverage < 0.2 && score > 0) {
    verdict = `Małe pokrycie materiału — ${verdict.toLowerCase()}`;
  } else if (isPreliminary) {
    verdict = `Wstępna ocena: ${verdict.toLowerCase()}`;
  }

  const weakestTopics = [...engaged]
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
