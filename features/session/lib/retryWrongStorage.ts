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

/** Non-destructive read — safe to call multiple times (React strict mode). */
export function peekRetryWrongIds(key: string): string[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}

/** Remove the persisted retry IDs after the session was successfully created. */
export function removeRetryWrongIds(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** @deprecated Use peekRetryWrongIds + removeRetryWrongIds for strict-mode safety. */
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
