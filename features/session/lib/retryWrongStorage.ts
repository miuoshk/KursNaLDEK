const KEY_PREFIX = "kurs-retry-wrong-";

export function persistRetryWrongIds(questionIds: string[]): string {
  const key = `${KEY_PREFIX}${Date.now()}`;
  try {
    sessionStorage.setItem(key, JSON.stringify(questionIds));
  } catch {
    /* ignore */
  }
  return key;
}

export function consumeRetryWrongIds(key: string): string[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    sessionStorage.removeItem(key);
    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}
