export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  targetValue: number;
  xpReward: number;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "pierwsza-sesja", name: "Pierwsza sesja", description: "Ukończ swoją pierwszą sesję nauki", icon: "Rocket", category: "milestones", targetValue: 1, xpReward: 25 },
  { id: "setka", name: "Setka", description: "Odpowiedz na 100 pytań", icon: "Hash", category: "milestones", targetValue: 100, xpReward: 50 },
  { id: "tysiac", name: "Tysiąc pytań", description: "Odpowiedz na 1000 pytań", icon: "Trophy", category: "milestones", targetValue: 1000, xpReward: 200 },
  { id: "maraton", name: "Maraton", description: "Odpowiedz na 100 pytań w jednym dniu", icon: "Zap", category: "milestones", targetValue: 100, xpReward: 100 },
  { id: "perfekcyjna-sesja", name: "Perfekcyjna sesja", description: "Zdobądź 100% w sesji z minimum 25 pytań", icon: "Star", category: "accuracy", targetValue: 1, xpReward: 100 },
  { id: "snajper", name: "Snajper", description: "Utrzymaj 90%+ trafność przez 7 kolejnych dni", icon: "Target", category: "accuracy", targetValue: 7, xpReward: 150 },
  { id: "tygodniowy-rytm", name: "Tygodniowy rytm", description: "Utrzymaj streak przez 7 dni", icon: "Calendar", category: "consistency", targetValue: 7, xpReward: 50 },
  { id: "miesieczna-dyscyplina", name: "Miesięczna dyscyplina", description: "Utrzymaj streak przez 30 dni", icon: "CalendarCheck", category: "consistency", targetValue: 30, xpReward: 200 },
  { id: "kwartalna-konsekwencja", name: "Kwartalna konsekwencja", description: "Utrzymaj streak przez 90 dni", icon: "Award", category: "consistency", targetValue: 90, xpReward: 500 },
  { id: "wszechstronny", name: "Wszechstronny", description: "Osiągnij 50% opanowania we wszystkich przedmiotach", icon: "Globe", category: "mastery", targetValue: 1, xpReward: 300 },
  { id: "nocny-maratonczyk", name: "Nocny maratończyk", description: "Odpowiedz na 50 pytań po godzinie 22:00", icon: "Moon", category: "special", targetValue: 50, xpReward: 75 },
  { id: "wczesny-ptak", name: "Wczesny ptak", description: "Ucz się przed godziną 6:00", icon: "Sunrise", category: "special", targetValue: 1, xpReward: 50 },
];
