import "server-only";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/** Prosty limiter w pamięci procesu — chroni przed brute-force na auth. */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true };
}

export const AUTH_RATE_LIMIT_MESSAGE =
  "Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.";

/** Klucze per IP + per e-mail — ogranicza zarówno skanowanie haseł, jak i flood z jednego IP. */
export function assertAuthRateLimit(params: {
  action: string;
  ip: string | null;
  email?: string | null;
}): { blocked: false } | { blocked: true; message: string } {
  const ipKey = params.ip?.trim() || "unknown-ip";
  const emailKey = params.email?.trim().toLowerCase();

  const checks: Array<{ key: string; limit: number; windowMs: number }> = [
    { key: `${params.action}:ip:${ipKey}`, limit: 30, windowMs: 15 * 60 * 1000 },
  ];

  if (emailKey) {
    checks.push({
      key: `${params.action}:email:${emailKey}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
  }

  for (const check of checks) {
    const result = consumeRateLimit(check.key, check.limit, check.windowMs);
    if (!result.allowed) {
      return { blocked: true, message: AUTH_RATE_LIMIT_MESSAGE };
    }
  }

  return { blocked: false };
}
