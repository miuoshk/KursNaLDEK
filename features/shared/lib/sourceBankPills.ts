import { hasCemExams } from "@/lib/products";
import type { SourceFilterCounts } from "@/features/session/lib/sourceFilter";

export function shouldShowSourceBankPills(product?: string | null): boolean {
  return hasCemExams(product);
}

export function sourceBankOwnCount(
  sourceCounts: SourceFilterCounts | null | undefined,
  fallbackTotal: number,
): number {
  if (!sourceCounts) return Math.max(0, fallbackTotal);
  return Math.max(0, sourceCounts.own);
}

export function sourceBankCemCount(
  sourceCounts: SourceFilterCounts | null | undefined,
): number {
  return Math.max(0, sourceCounts?.reference ?? 0);
}
