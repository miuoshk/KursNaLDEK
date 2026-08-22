import { questionMatchesSource } from "@/features/session/lib/sourceFilter";
import type {
  TestExportProduct,
  TestExportSource,
  TopicSourceCount,
} from "@/features/admin/lib/testExport/types";

export function countRowMatchesFilter(
  row: TopicSourceCount,
  source: TestExportSource,
  product: TestExportProduct,
  cemSessionIds: string[],
): boolean {
  if (!questionMatchesSource(row.source, source, product)) return false;
  if (row.source === "cem" && cemSessionIds.length > 0) {
    return (
      row.firstSeenSession != null && cemSessionIds.includes(row.firstSeenSession)
    );
  }
  return true;
}

export function poolSizeForTopic(
  counts: TopicSourceCount[],
  topicId: string,
  source: TestExportSource,
  product: TestExportProduct,
  cemSessionIds: string[],
): number {
  let total = 0;
  for (const row of counts) {
    if (row.topicId !== topicId) continue;
    if (!countRowMatchesFilter(row, source, product, cemSessionIds)) continue;
    total += row.count;
  }
  return total;
}

export function questionMatchesExportFilter(
  question: {
    source: string | null;
    firstSeenSession: string | null;
  },
  source: TestExportSource,
  product: TestExportProduct,
  cemSessionIds: string[],
): boolean {
  return countRowMatchesFilter(
    {
      topicId: "",
      source: question.source ?? "own",
      firstSeenSession: question.firstSeenSession,
      count: 1,
    },
    source,
    product,
    cemSessionIds,
  );
}
