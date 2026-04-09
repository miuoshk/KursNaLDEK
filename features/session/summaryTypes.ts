import type { Confidence, SessionMode } from "@/features/session/types";

/** Insight po sesji (ANTARES), serializowane do JSON w `study_sessions.session_insights`). */
export interface SessionInsightsPayload {
  accuracy: number;
  avgTimeSeconds: number;
  fastestQuestion: { id: string; time: number } | null;
  slowestQuestion: { id: string; time: number } | null;
  topicAccuracy: Array<{
    topicId: string;
    correct: number;
    total: number;
    accuracy: number;
  }>;
  leechesHit: string[];
  retrievabilityGain: number;
  masteryDelta: Array<{ topicId: string; delta: number }>;
  nextSessionFocus: string | null;
  fatigueWarning: string | null;
  calibrationTip: string | null;
}

/** Skrót gotowości egzaminacyjnej po zamknięciu sesji. */
export interface ExamReadinessSnapshot {
  score: number;
  verdict: string;
  weakestTopics: string[];
  estimatedReadyDate: string | null;
  dailyRecommendation: number;
}

export interface SessionSummaryData {
  sessionId: string;
  subjectName: string;
  subjectShortName: string;
  mode: SessionMode;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  durationSeconds: number;
  avgTimePerQuestion: number;
  xpEarned: number;
  longestStreak: number;
  previousAccuracy: number | null;
  answers: {
    questionId: string;
    questionText: string;
    topicName: string;
    selectedOptionId: string;
    correctOptionId: string;
    selectedOptionText: string;
    correctOptionText: string;
    isCorrect: boolean;
    confidence: Confidence | null;
    timeSpentSeconds: number;
  }[];
  topicBreakdown: {
    topicName: string;
    correct: number;
    total: number;
    accuracy: number;
  }[];
  newXpTotal: number;
  newStreak: number;
  /** Streak dni przed zamknięciem tej sesji (tylko gdy completeSession) */
  previousStreakDays: number | null;
  newQuestionsCount: number;
  reviewCount: number;
  achievementUnlocked: string | null;
  subjectId: string;
  /** Uzupełniane przy `completeSession` (ANTARES). */
  sessionInsights?: SessionInsightsPayload;
  examReadiness?: ExamReadinessSnapshot;
}
