/**
 * Tymczasowa instrumentacja latency podsumowania sesji.
 * Do zdjęcia po pomiarze na Vercelu — nie zostawiać na stałe.
 */

export type PerfSpan = {
  name: string;
  ms: number;
};

export function vercelRuntimeMeta(): Record<string, string | null> {
  return {
    vercelRegion: process.env.VERCEL_REGION ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nextRuntime: process.env.NEXT_RUNTIME ?? null,
    vercelFluid:
      process.env.VERCEL_FLUID ??
      process.env.VERCEL_ENABLE_FLUID ??
      process.env.VERCEL_FLUID_COMPUTE ??
      null,
  };
}

export function logPerf(label: string, extra?: Record<string, unknown>): void {
  console.info(`[perf] ${label}`, { t: Date.now(), ...extra });
}

export function createPerfSpan(label: string) {
  const t0 = performance.now();
  const startedAt = Date.now();
  const spans: PerfSpan[] = [];
  let last = t0;
  return {
    startedAt,
    mark(name: string): number {
      const now = performance.now();
      const ms = Math.round((now - last) * 10) / 10;
      spans.push({ name, ms });
      last = now;
      return ms;
    },
    end(extra?: Record<string, unknown>): number {
      const totalMs = Math.round((performance.now() - t0) * 10) / 10;
      const awaitSumMs =
        Math.round(spans.reduce((sum, span) => sum + span.ms, 0) * 10) / 10;
      console.info(`[perf] ${label}`, {
        totalMs,
        awaitSumMs,
        startedAt,
        endedAt: Date.now(),
        spans,
        ...vercelRuntimeMeta(),
        ...extra,
      });
      return totalMs;
    },
  };
}

export function sessionSummaryPerfT0Key(sessionId: string): string {
  return `perf-summary-t0-${sessionId}`;
}

export function markSessionSummaryPerfT0(sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(sessionSummaryPerfT0Key(sessionId), String(Date.now()));
  } catch {
    /* quota / private mode */
  }
}

export function readSessionSummaryPerfT0(sessionId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(sessionSummaryPerfT0Key(sessionId));
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
