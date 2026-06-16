export type AchievementDef = {
  id: string;
  icon: string;
  category: string;
  targetValue: number;
  xpReward: number;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "pierwsza-sesja", icon: "Rocket", category: "milestones", targetValue: 1, xpReward: 25 },
  { id: "setka", icon: "Hash", category: "milestones", targetValue: 100, xpReward: 50 },
  { id: "tysiac", icon: "Trophy", category: "milestones", targetValue: 1000, xpReward: 200 },
  { id: "maraton", icon: "Zap", category: "milestones", targetValue: 100, xpReward: 100 },
  { id: "perfekcyjna-sesja", icon: "Star", category: "accuracy", targetValue: 1, xpReward: 100 },
  { id: "snajper", icon: "Target", category: "accuracy", targetValue: 7, xpReward: 150 },
  { id: "tygodniowy-rytm", icon: "Calendar", category: "consistency", targetValue: 7, xpReward: 50 },
  { id: "miesieczna-dyscyplina", icon: "CalendarCheck", category: "consistency", targetValue: 30, xpReward: 200 },
  { id: "kwartalna-konsekwencja", icon: "Award", category: "consistency", targetValue: 90, xpReward: 500 },
  { id: "wszechstronny", icon: "Globe", category: "mastery", targetValue: 1, xpReward: 300 },
  { id: "nocny-maratonczyk", icon: "Moon", category: "special", targetValue: 50, xpReward: 75 },
  { id: "wczesny-ptak", icon: "Sunrise", category: "special", targetValue: 1, xpReward: 50 },
];
