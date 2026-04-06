export type AchievementRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  targetValue: number;
  xpReward: number;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
  /** Ukryty opis (???) dopóki nie ma śledzenia postępu */
  locked: boolean;
};

export type LeaderboardRow = {
  rank: number;
  userId: string;
  displayName: string;
  initials: string;
  rankName: string;
  rankColorClass: string;
  xp: number;
  accuracy: number;
  streak: number;
  isCurrent: boolean;
};

export type GamificationPayload = {
  xp: number;
  displayName: string;
  initials: string;
  streak: number;
  totalQuestionsAnswered: number;
  avgAccuracy: number;
  totalStudyMinutes: number;
  achievements: AchievementRow[];
  leaderboard: LeaderboardRow[];
  leaderboardPeriod: "7" | "30" | "all";
};
