import type { Confidence, SessionMode } from "@/features/session/types";

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
}
