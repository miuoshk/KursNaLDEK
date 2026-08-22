import { FEATURES } from "@/lib/featureFlags";
import {
  hasReferenceSources,
  isSourceFilterLive,
  referenceSources,
  type QuestionSourceValue,
} from "@/lib/products";
import type { SourceFilter } from "@/features/session/types";

export type { SourceFilter };

export type SourceFilterCounts = {
  all: number;
  reference: number;
  own: number;
};

export function parseSourceFilter(value: unknown): SourceFilter | null {
  if (value === "all" || value === "reference" || value === "own") return value;
  return null;
}

export function parseSourceFilterOrAll(value: unknown): SourceFilter {
  return parseSourceFilter(value) ?? "all";
}

/**
 * Silnik: OSCE i inne produkty bez źródeł referencyjnych zawsze dostają `all`,
 * nawet gdy ktoś dopisze `?src=reference` do URL-a. Nie zwracamy pustej puli.
 */
export function resolveEngineSourceFilter(
  source: SourceFilter | null | undefined,
  product: string | null | undefined,
): SourceFilter {
  const parsed = parseSourceFilterOrAll(source);
  if (!hasReferenceSources(product)) return "all";
  return parsed;
}

/** UI i gałęzie algorytmu. Bramka: subjects.product, nie current_product. */
export function isSourceFilterUiEnabled(product?: string | null): boolean {
  return FEATURES.cemSource && isSourceFilterLive(product);
}

export function sourceCountsFromTotals(
  total: number,
  ref: number,
): SourceFilterCounts {
  const all = Math.max(0, total);
  const reference = Math.max(0, Math.min(ref, all));
  return { all, reference, own: Math.max(0, all - reference) };
}

export function countForSource(
  counts: SourceFilterCounts,
  source: SourceFilter,
): number {
  if (source === "reference") return counts.reference;
  if (source === "own") return counts.own;
  return counts.all;
}

export function topicCountForSource(
  topic: { question_count: number; question_count_ref?: number | null },
  source: SourceFilter,
  enabled: boolean,
): number {
  if (!enabled) return topic.question_count;
  return countForSource(
    sourceCountsFromTotals(topic.question_count, topic.question_count_ref ?? 0),
    source,
  );
}

export function topicAnsweredForSource(
  topic: {
    answered_count: number;
    answered_count_ref?: number | null;
    answered_count_own?: number | null;
  },
  source: SourceFilter,
  enabled: boolean,
): number {
  if (!enabled || source === "all") return topic.answered_count;
  if (source === "reference") return topic.answered_count_ref ?? 0;
  return topic.answered_count_own ?? 0;
}

export function questionMatchesSource(
  source: QuestionSourceValue | string | null | undefined,
  filter: SourceFilter,
  product: string,
): boolean {
  if (filter === "all") return true;
  if (filter === "own") return source === "own";
  return referenceSources(product).includes(source as QuestionSourceValue);
}

type QueryWithSource = {
  eq: (column: string, value: string) => QueryWithSource;
  in: (column: string, values: string[]) => QueryWithSource;
};

/**
 * Nakłada filtr źródła na zapytanie `questions`.
 * `own` to zawsze source = 'own', nigdy dopełnienie referencyjnych.
 */
export function applySourceFilterToQuestionQuery<T extends QueryWithSource>(
  query: T,
  source: SourceFilter,
  product: string,
): T {
  const resolved = resolveEngineSourceFilter(source, product);
  if (resolved === "all") return query;
  if (resolved === "own") return query.eq("source", "own") as T;
  return query.in("source", referenceSources(product)) as T;
}
