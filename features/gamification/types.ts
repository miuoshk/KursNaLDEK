export type AchievementRow = {
  id: string;
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
  avatarEmoji: string | null;
  rankTierId: string;
  rankColorClass: string;
  xp: number;
  accuracy: number;
  streak: number;
  questionsAnswered: number;
  /** ISO string ostatniego ping'a (last_seen_at); null gdy user nigdy nie był online. */
  lastSeenAt: string | null;
  isCurrent: boolean;
};

export type LeaderboardScope = "all" | "year";

export type GamificationPayload = {
  xp: number;
  displayName: string;
  initials: string;
  avatarEmoji: string | null;
  streak: number;
  totalQuestionsAnswered: number;
  avgAccuracy: number;
  totalStudyMinutes: number;
  achievements: AchievementRow[];
  leaderboard: LeaderboardRow[];
  leaderboardPeriod: "7" | "30" | "all";
  leaderboardScope: LeaderboardScope;
  /** Rok studiów aktualnego usera; potrzebny do etykiety filtra "Mój rok" */
  currentYear: number | null;
};
