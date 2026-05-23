export const SESSION_COUNT_PRESETS = [10, 25, 50] as const;
export type SessionCountPreset = (typeof SESSION_COUNT_PRESETS)[number];

export const DEFAULT_SESSION_COUNT = 25;
export const SESSION_COUNT_MIN = 1;
export const SESSION_COUNT_MAX = 5000;

export function clampSessionCount(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SESSION_COUNT;
  return Math.min(
    SESSION_COUNT_MAX,
    Math.max(SESSION_COUNT_MIN, Math.floor(value)),
  );
}

type ProfileCountSource = {
  last_session_question_count?: number | null;
  default_question_count?: number | null;
};

/** Ostatnia liczba pytań z sesji lub preferencja z ustawień. */
export function getPreferredSessionCount(
  profile: ProfileCountSource | null | undefined,
): number {
  const lastUsed = profile?.last_session_question_count;
  if (lastUsed != null && lastUsed >= SESSION_COUNT_MIN) {
    return clampSessionCount(lastUsed);
  }
  const profileDefault = profile?.default_question_count;
  if (profileDefault != null && profileDefault >= SESSION_COUNT_MIN) {
    return clampSessionCount(profileDefault);
  }
  return DEFAULT_SESSION_COUNT;
}

export function resolveSessionCount(input: {
  explicit?: number | null;
  lastUsed?: number | null;
  profileDefault?: number | null;
}): number {
  if (input.explicit != null && input.explicit >= SESSION_COUNT_MIN) {
    return clampSessionCount(input.explicit);
  }
  if (input.lastUsed != null && input.lastUsed >= SESSION_COUNT_MIN) {
    return clampSessionCount(input.lastUsed);
  }
  if (input.profileDefault != null && input.profileDefault >= SESSION_COUNT_MIN) {
    return clampSessionCount(input.profileDefault);
  }
  return DEFAULT_SESSION_COUNT;
}

export type SessionStartParams = {
  subject?: string;
  topic?: string;
  mode?: string;
  count?: number;
  retry?: string;
};

export function buildSessionStartHref(params: SessionStartParams = {}): string {
  const q = new URLSearchParams();
  if (params.subject) q.set("subject", params.subject);
  if (params.topic) q.set("topic", params.topic);
  q.set("mode", params.mode ?? "inteligentna");
  q.set("count", String(clampSessionCount(params.count ?? DEFAULT_SESSION_COUNT)));
  if (params.retry) q.set("retry", params.retry);
  return `/sesja/new?${q.toString()}`;
}

export type CountPickerState = {
  preset: SessionCountPreset | "all" | null;
  custom: string;
};

/** Mapuje zapisaną liczbę pytań na stan pickera (10/25/50 lub custom). */
export function sessionCountToPickerState(count: number): CountPickerState {
  const clamped = clampSessionCount(count);
  if (clamped === 10 || clamped === 25 || clamped === 50) {
    return { preset: clamped, custom: "" };
  }
  return { preset: null, custom: String(clamped) };
}
