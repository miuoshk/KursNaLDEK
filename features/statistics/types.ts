export type TimeRangeKey = "7" | "30" | "90" | "all";

export interface StatisticsPayload {
  range: TimeRangeKey;
  accuracyTrend: { date: string; accuracy: number }[];
  studyTimePerDay: { date: string; minutes: number }[];
  subjectMastery: {
    subjectId: string;
    subjectName: string;
    mastery: number;
  }[];
  weakTopics: {
    topicId: string;
    topicName: string;
    subjectId: string;
    accuracy: number;
    answers: number;
  }[];
  predictedReadiness: number | null;
  readinessMargin: number;
  totalQuestionsAnswered: number;
  totalStudyMinutes: number;
  currentStreak: number;
  xp: number;
  heatmap: { date: string; level: number }[];
}
