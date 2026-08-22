import { questionMatchesExportFilter } from "@/features/admin/lib/testExport/poolCount";
import {
  MAX_TEST_QUESTIONS,
  type SelectableQuestion,
  type SelectQuestionsError,
  type SelectQuestionsInput,
  type SelectQuestionsResult,
  type TestExportTopicQuota,
} from "@/features/admin/lib/testExport/types";

/** Deterministyczny RNG (mulberry32) — ten sam seed = ten sam arkusz. */
export function createSeededRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleInPlace<T>(items: T[], rng: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = items[i]!;
    items[i] = items[j]!;
    items[j] = tmp;
  }
  return items;
}

export function selectQuestions<T extends SelectableQuestion>(
  input: SelectQuestionsInput<T>,
): SelectQuestionsResult<T> {
  const max = input.maxQuestions ?? MAX_TEST_QUESTIONS;
  const quotas = input.quotas.filter((q) => q.count > 0);
  if (quotas.length === 0) {
    return { ok: false, error: { code: "empty_blueprint" } };
  }

  const requested = quotas.reduce((sum, q) => sum + q.count, 0);
  if (requested > max) {
    return { ok: false, error: { code: "over_limit", requested, max } };
  }

  const rng = createSeededRng(input.seed);
  const picked: T[] = [];

  for (const quota of quotas) {
    const candidates = input.pool.filter(
      (q) =>
        q.topicId === quota.topicId &&
        questionMatchesExportFilter(
          q,
          input.source,
          input.product,
          input.cemSessionIds,
        ),
    );

    if (quota.count > candidates.length) {
      return {
        ok: false,
        error: {
          code: "insufficient_pool",
          topicId: quota.topicId,
          requested: quota.count,
          available: candidates.length,
        },
      };
    }

    const ordered = input.shuffle
      ? shuffleInPlace([...candidates], rng)
      : [...candidates].sort((a, b) => a.id.localeCompare(b.id));
    picked.push(...ordered.slice(0, quota.count));
  }

  const finalList = input.shuffle ? shuffleInPlace([...picked], rng) : picked;

  return {
    ok: true,
    questions: finalList.map((question, index) => ({
      ...question,
      number: index + 1,
    })),
  };
}

export function allocateEqual(
  topicIds: string[],
  poolByTopic: Map<string, number>,
  total: number,
): TestExportTopicQuota[] {
  const eligible = topicIds.filter((id) => (poolByTopic.get(id) ?? 0) > 0);
  if (eligible.length === 0 || total <= 0) {
    return topicIds.map((topicId) => ({ topicId, count: 0 }));
  }

  const cap = Math.min(
    total,
    eligible.reduce((sum, id) => sum + (poolByTopic.get(id) ?? 0), 0),
  );
  const counts = new Map<string, number>(eligible.map((id) => [id, 0]));
  let remaining = cap;
  let progressed = true;
  while (remaining > 0 && progressed) {
    progressed = false;
    for (const id of eligible) {
      if (remaining <= 0) break;
      const pool = poolByTopic.get(id) ?? 0;
      const current = counts.get(id) ?? 0;
      if (current >= pool) continue;
      counts.set(id, current + 1);
      remaining -= 1;
      progressed = true;
    }
  }

  return topicIds.map((topicId) => ({
    topicId,
    count: counts.get(topicId) ?? 0,
  }));
}

export function allocateProportional(
  topicIds: string[],
  poolByTopic: Map<string, number>,
  total: number,
): TestExportTopicQuota[] {
  const eligible = topicIds.filter((id) => (poolByTopic.get(id) ?? 0) > 0);
  if (eligible.length === 0 || total <= 0) {
    return topicIds.map((topicId) => ({ topicId, count: 0 }));
  }

  const poolSum = eligible.reduce((sum, id) => sum + (poolByTopic.get(id) ?? 0), 0);
  const cap = Math.min(total, poolSum);
  const raw = eligible.map((id) => {
    const pool = poolByTopic.get(id) ?? 0;
    const exact = (pool / poolSum) * cap;
    const floored = Math.min(pool, Math.floor(exact));
    return { id, pool, exact, count: floored, frac: exact - floored };
  });

  let used = raw.reduce((sum, row) => sum + row.count, 0);
  const leftover = [...raw].sort((a, b) => b.frac - a.frac || a.id.localeCompare(b.id));
  for (const row of leftover) {
    if (used >= cap) break;
    if (row.count >= row.pool) continue;
    row.count += 1;
    used += 1;
  }

  const byId = new Map(raw.map((row) => [row.id, row.count]));
  return topicIds.map((topicId) => ({
    topicId,
    count: byId.get(topicId) ?? 0,
  }));
}

export function clampQuotaToPool(
  count: number,
  pool: number,
  othersSum: number,
  max = MAX_TEST_QUESTIONS,
): number {
  const room = Math.max(0, max - othersSum);
  return Math.max(0, Math.min(count, pool, room));
}

export function formatSelectError(error: SelectQuestionsError): string {
  switch (error.code) {
    case "empty_blueprint":
      return "Zaznacz przynajmniej jeden temat i podaj liczbę pytań.";
    case "over_limit":
      return `Za dużo pytań: ${error.requested} (maks. ${error.max}).`;
    case "insufficient_pool":
      return `Za mała pula w ${error.topicId}: potrzeba ${error.requested}, jest ${error.available}.`;
    default:
      return "Nie udało się dobrać pytań.";
  }
}
