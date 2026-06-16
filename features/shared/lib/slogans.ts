export type SloganPool = "sidebar" | "auth" | "sessionLoading";

const SLOGAN_POOL_KEYS = {
  sidebar: [
    "knowMoreThanHourAgo",
    "buildingClinicalThinking",
    "learningEffectively",
    "knowMorePlusOne",
  ],
  auth: [
    "oneMoreQuestion",
    "oneMoreWontHurt",
    "knowMoreThanHourAgo",
    "learningEffectively",
  ],
  sessionLoading: [
    "oneMoreQuestion",
    "oneMoreAndDone",
    "oneMoreWontHurt",
    "knowMoreThanMomentAgo",
    "eachQuestionCloser",
    "futureSelfThanks",
    "hardTodayObviousTomorrow",
    "diagnosisStartsWithQuestion",
    "nextMinutesForYou",
    "consistencyDoesWork",
    "disciplineBehindSuccess",
    "moreTodayThanYesterday",
    "shortSessionCounts",
    "memoryWhenYouReturn",
    "doingForFutureSelf",
    "progressNeedNotBeLoud",
    "calmButConsistent",
    "eachRepetitionReinforces",
  ],
} as const satisfies Record<SloganPool, readonly string[]>;

export type SlogansTranslator = (key: string) => string;

export function getSloganPool(t: SlogansTranslator, pool: SloganPool): string[] {
  return SLOGAN_POOL_KEYS[pool].map((key) => t(`${pool}.${key}`));
}

export function pickSlogan(pool: readonly string[], fallback = ""): string {
  if (pool.length === 0) return fallback;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? pool[0] ?? fallback;
}
